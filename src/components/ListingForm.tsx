import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db, storage } from '../firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Listing, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import React, { useState, useRef } from 'react';
import { Save, Loader2, Plus, X, Image as ImageIcon, AlertCircle, Upload, Sparkles } from 'lucide-react';
import { useUser } from '../UserContext';
import { useSettings } from '../SettingsContext';
import imageCompression from 'browser-image-compression';
import { GoogleGenAI, Type } from "@google/genai";

const listingSchema = z.object({
  title: z.string().min(5, 'Le titre doit faire au moins 5 caractères'),
  description: z.string().min(20, 'La description doit faire au moins 20 caractères'),
  translations: z.object({
    ar: z.object({
      title: z.string().min(5, 'Le titre arabe doit faire au moins 5 caractères').optional().or(z.literal('')),
      description: z.string().min(20, 'La description arabe doit faire au moins 20 caractères').optional().or(z.literal('')),
    }).optional(),
    en: z.object({
      title: z.string().min(5, 'Le titre anglais doit faire au moins 5 caractères').optional().or(z.literal('')),
      description: z.string().min(20, 'La description anglaise doit faire au moins 20 caractères').optional().or(z.literal('')),
    }).optional(),
    de: z.object({
      title: z.string().min(5, 'Le titre allemand doit faire au moins 5 caractères').optional().or(z.literal('')),
      description: z.string().min(20, 'La description allemande doit faire au moins 20 caractères').optional().or(z.literal('')),
    }).optional(),
    es: z.object({
      title: z.string().min(5, 'Le titre espagnol doit faire au moins 5 caractères').optional().or(z.literal('')),
      description: z.string().min(20, 'La description espagnole doit faire au moins 20 caractères').optional().or(z.literal('')),
    }).optional(),
  }).optional(),
  type: z.enum(['sale', 'rent']),
  propertyType: z.enum(['apartment', 'house', 'studio', 'office']),
  price: z.number().min(0, 'Le prix doit être positif'),
  location: z.string().min(3, 'La localisation est requise'),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(0),
  area: z.number().min(1, 'La superficie doit être au moins de 1m²'),
  whatsappNumber: z.string().min(10, 'Numéro WhatsApp requis'),
  videoUrl: z.string().optional().or(z.literal('')),
  virtualTourUrl: z.string().optional().or(z.literal('')),
  amenities: z.array(z.string()),
  status: z.enum(['available', 'sold', 'rented']),
});

const MAX_IMAGES = 12;

type ListingFormData = z.infer<typeof listingSchema>;

interface ListingFormProps {
  listing?: Listing | null;
  onSuccess: () => void;
}

export default function ListingForm({ listing, onSuccess }: ListingFormProps) {
  const { profile } = useUser();
  const { settings } = useSettings();
  const [images, setImages] = useState<string[]>(listing?.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [amenities, setAmenities] = useState<string[]>(listing?.amenities || []);
  const [newAmenity, setNewAmenity] = useState('');
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const blobCache = useRef<Record<string, { data: string; mimeType: string }>>({});
  const [error, setError] = useState('');
  const [activeLang, setActiveLang] = useState<'fr' | 'ar' | 'en' | 'de' | 'es'>('fr');

  const { register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: listing ? {
      title: listing.title,
      description: listing.description,
      translations: listing.translations || {
        ar: { title: '', description: '' },
        en: { title: '', description: '' },
        de: { title: '', description: '' },
        es: { title: '', description: '' },
      },
      type: listing.type,
      propertyType: listing.propertyType,
      price: listing.price,
      location: listing.location,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      area: listing.area,
      whatsappNumber: listing.whatsappNumber,
      videoUrl: listing.videoUrl || '',
      virtualTourUrl: listing.virtualTourUrl || '',
      status: listing.status,
      amenities: listing.amenities || [],
    } : {
      type: 'rent',
      propertyType: 'apartment',
      status: 'available',
      bedrooms: 0,
      bathrooms: 0,
      area: 0,
      price: 0,
      whatsappNumber: '',
      title: '',
      description: '',
      location: '',
      amenities: [],
      translations: {
        ar: { title: '', description: '' },
        en: { title: '', description: '' },
        de: { title: '', description: '' },
        es: { title: '', description: '' },
      }
    }
  });

  const onSubmit = async (data: ListingFormData) => {
    if (images.length === 0) {
      setError('Veuillez ajouter au moins une image.');
      return;
    }

    if (!profile || profile.role !== 'admin') {
      setError('Vous devez être administrateur pour publier une annonce.');
      return;
    }

    setLoading(true);
    setError('');
    const path = 'listings';
    try {
      // Helper to remove undefined/null values recursively
      const cleanObject = (obj: any): any => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(item => cleanObject(item));
        
        return Object.entries(obj).reduce((acc: any, [key, value]) => {
          if (value === undefined || value === null) return acc;
          acc[key] = (typeof value === 'object') ? cleanObject(value) : value;
          return acc;
        }, {});
      };

      const cleanData = cleanObject(data);
      const listingData = {
        ...cleanData,
        images,
        amenities,
        updatedAt: new Date().toISOString(),
        createdByEmail: profile?.email || 'Admin',
      };

      if (listing) {
        await updateDoc(doc(db, path, listing.id), listingData);
      } else {
        await addDoc(collection(db, path), {
          ...listingData,
          createdAt: new Date().toISOString(),
        });
      }
      onSuccess();
    } catch (err: any) {
      console.error('Error saving listing:', err);
      try {
        handleFirestoreError(err, listing ? OperationType.UPDATE : OperationType.CREATE, path);
      } catch (jsonErr: any) {
        const info = JSON.parse(jsonErr.message);
        setError(`Erreur de permission : ${info.error}. Vérifiez que vous êtes bien administrateur.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const addImage = () => {
    if (images.length >= MAX_IMAGES) {
      setError(`Limite atteinte : ${MAX_IMAGES} images maximum par annonce.`);
      return;
    }
    if (newImageUrl && !images.includes(newImageUrl)) {
      setImages([...images, newImageUrl]);
      setNewImageUrl('');
    }
  };

  const processFiles = async (selectedFiles: File[]) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      setError('Veuillez sélectionner des images valides (PNG, JPG, WebP...).');
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setError(`Limite atteinte : ${MAX_IMAGES} images maximum par annonce.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToUpload = imageFiles.slice(0, remainingSlots);
    if (imageFiles.length > remainingSlots) {
      setError(`Seules les ${remainingSlots} premières images ont été sélectionnées (limite de ${MAX_IMAGES} photos atteinte).`);
    } else {
      setError('');
    }

    setUploading(true);
    setUploadProgress(5);
    setUploadStatusText(`Préparation de ${filesToUpload.length} image(s)...`);

    const newUploadedUrls: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const stepPercent = Math.round(((i) / filesToUpload.length) * 90) + 5;
      setUploadProgress(stepPercent);
      setUploadStatusText(`Importation de la photo ${i + 1} sur ${filesToUpload.length}...`);

      try {
        // 1. Compression
        const options = {
          maxSizeMB: 0.4,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        };

        let fileToUpload: Blob | File = file;
        try {
          fileToUpload = await imageCompression(file, options);
        } catch (compressionError) {
          console.warn('DEBUG: Compression warning:', compressionError);
          fileToUpload = file;
        }

        // 2. Base64 Data URL for fallback & AI cache
        const base64Data = await new Promise<{ dataUrl: string; base64: string; mimeType: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            resolve({
              dataUrl,
              base64,
              mimeType: fileToUpload.type || 'image/jpeg'
            });
          };
          reader.readAsDataURL(fileToUpload);
        });

        let finalUrl = '';

        // Tier 1: Try backend /api/upload endpoint
        try {
          const formData = new FormData();
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          formData.append('file', fileToUpload, safeName);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (res.ok) {
            const json = await res.json();
            if (json.url) {
              finalUrl = json.url;
            }
          }
        } catch (backendErr) {
          console.warn('DEBUG: Backend upload fallback:', backendErr);
        }

        // Tier 2: Try Firebase Storage if backend didn't return a URL
        if (!finalUrl) {
          try {
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${Date.now()}_${safeName}`;
            const storageRef = ref(storage, `listings/${fileName}`);
            const uploadResult = await uploadBytes(storageRef, fileToUpload);
            finalUrl = await getDownloadURL(uploadResult.ref);
          } catch (storageErr) {
            console.warn('DEBUG: Firebase Storage upload fallback:', storageErr);
          }
        }

        // Tier 3: Guaranteed fallback to optimized base64 Data URL
        if (!finalUrl) {
          finalUrl = base64Data.dataUrl;
        }

        // Cache for Gemini AI Auto-fill
        blobCache.current[finalUrl] = {
          data: base64Data.base64,
          mimeType: base64Data.mimeType
        };

        newUploadedUrls.push(finalUrl);
      } catch (err: any) {
        console.error('DEBUG: Error importing image:', file.name, err);
      }
    }

    if (newUploadedUrls.length > 0) {
      setImages(prev => [...prev, ...newUploadedUrls].slice(0, MAX_IMAGES));
    }

    setUploadProgress(100);
    setUploadStatusText('');
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addAmenity = () => {
    if (newAmenity && !amenities.includes(newAmenity)) {
      setAmenities([...amenities, newAmenity]);
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const handleAiAutofill = async () => {
    if (images.length === 0) {
      setError('Veuillez ajouter au moins une image pour utiliser le remplissage auto.');
      return;
    }

    setAutofilling(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Use the first 3 images for analysis to be efficient
      const imagesToAnalyze = images.slice(0, 3);
      
      const imageParts = await Promise.all(
        imagesToAnalyze.map(async (url) => {
          // 1. Direct Data URL
          if (url.startsWith('data:')) {
            const [meta, base64] = url.split(',');
            const mimeType = meta.split(';')[0].replace('data:', '') || 'image/jpeg';
            return {
              inlineData: {
                data: base64,
                mimeType: mimeType,
              },
            };
          }

          // 2. Try internal cache (avoids CORS "Failed to fetch")
          if (blobCache.current[url]) {
            return {
              inlineData: {
                data: blobCache.current[url].data,
                mimeType: blobCache.current[url].mimeType,
              },
            };
          }

          // 3. Fallback to fetch for existing external images
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            return new Promise<any>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({
                  inlineData: {
                    data: base64,
                    mimeType: blob.type,
                  },
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (fetchErr) {
            console.error('Fetch error for URL:', url, fetchErr);
            // If fetch fails, we skip this image but continue with others if possible
            return null;
          }
        })
      ).then(parts => parts.filter(p => p !== null));
      
      if (imageParts.length === 0) {
        throw new Error('Impossible de lire les images (Erreur de connexion ou CORS). Essayez de ré-importer les images.');
      }

      const propertyType = getValues('propertyType');
      const offerType = getValues('type');

      const prompt = `Analyez ces images d'un bien immobilier (${propertyType === 'apartment' ? 'appartement' : propertyType === 'house' ? 'maison' : propertyType} en ${offerType === 'sale' ? 'vente' : 'location'}).
      Générez un titre accrocheur et une description détaillée et professionnelle.
      
      Retournez les résultats en JSON pour le français (fr), l'arabe (ar), l'anglais (en), l'allemand (de) et l'espagnol (es).
      
      Format:
      {
        "fr": { "title": "...", "description": "..." },
        "ar": { "title": "...", "description": "..." },
        "en": { "title": "...", "description": "..." },
        "de": { "title": "...", "description": "..." },
        "es": { "title": "...", "description": "..." }
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { text: prompt },
          ...imageParts
        ],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const responseText = response.text || '';
      
      // Clean potential markdown code blocks
      const cleanedJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
      const listingData = JSON.parse(cleanedJson);

      if (listingData.fr) {
        setValue('title', listingData.fr.title);
        setValue('description', listingData.fr.description);
      }
      if (listingData.ar) {
        setValue('translations.ar.title', listingData.ar.title);
        setValue('translations.ar.description', listingData.ar.description);
      }
      if (listingData.en) {
        setValue('translations.en.title', listingData.en.title);
        setValue('translations.en.description', listingData.en.description);
      }
      if (listingData.de) {
        setValue('translations.de.title', listingData.de.title);
        setValue('translations.de.description', listingData.de.description);
      }
      if (listingData.es) {
        setValue('translations.es.title', listingData.es.title);
        setValue('translations.es.description', listingData.es.description);
      }

      setError('');
    } catch (err: any) {
      console.error('AI Autofill error:', err);
      setError('Erreur lors de l\'auto-remplissage. Assurez-vous que les images sont accessibles publicment.');
    } finally {
      setAutofilling(false);
    }
  };

  const handleAiTranslate = async () => {
    const values = getValues();
    let sourceTitle = '';
    let sourceDesc = '';

    if (activeLang === 'fr') {
      sourceTitle = values.title;
      sourceDesc = values.description;
    } else {
      sourceTitle = values.translations?.[activeLang]?.title || '';
      sourceDesc = values.translations?.[activeLang]?.description || '';
    }

    if (!sourceTitle || !sourceDesc) {
      setError('Veuillez remplir le titre et la description en français avant de traduire.');
      return;
    }

    setTranslating(true);
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Translate the following real estate listing from ${activeLang} to the other languages (French, Arabic, English, German, and Spanish).
      
      Source Title: ${sourceTitle}
      Source Description: ${sourceDesc}
      
      Return the translations in JSON format.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ar: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
              en: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
              fr: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
              de: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
              es: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["title", "description"],
              },
            },
          },
        },
      });

      const result = JSON.parse(response.text);

      if (activeLang !== 'fr' && result.fr) {
        setValue('title', result.fr.title);
        setValue('description', result.fr.description);
      }
      if (activeLang !== 'ar' && result.ar) {
        setValue('translations.ar.title', result.ar.title);
        setValue('translations.ar.description', result.ar.description);
      }
      if (activeLang !== 'en' && result.en) {
        setValue('translations.en.title', result.en.title);
        setValue('translations.en.description', result.en.description);
      }
      if (activeLang !== 'de' && result.de) {
        setValue('translations.de.title', result.de.title);
        setValue('translations.de.description', result.de.description);
      }
      if (activeLang !== 'es' && result.es) {
        setValue('translations.es.title', result.es.title);
        setValue('translations.es.description', result.es.description);
      }
    } catch (err: any) {
      console.error('AI Translation error:', err);
      setError('Erreur lors de la traduction IA. Veuillez réessayer.');
    } finally {
      setTranslating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col text-red-700 text-sm">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-gray-700">Contenu de l'annonce</label>
                <button
                  type="button"
                  onClick={handleAiTranslate}
                  disabled={translating}
                  className="flex items-center text-xs text-orange-600 font-bold mt-1 hover:text-orange-700 disabled:opacity-50"
                  title="Traduire automatiquement en AR et EN avec l'IA"
                >
                  {translating ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Traduire avec IA
                </button>
              </div>
              <div className="flex bg-white p-1 rounded-lg border border-gray-200">
                {(['fr', 'ar', 'en', 'de', 'es'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                      activeLang === lang 
                        ? 'bg-orange-600 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {activeLang === 'fr' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Titre (Français)</label>
                  <input 
                    {...register('title')}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Bel appartement T3 au centre-ville"
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description (Français)</label>
                  <textarea 
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Décrivez le bien en détail..."
                  />
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                </div>
              </div>
            )}

            {activeLang === 'ar' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Titre (Arabe)</label>
                  <input 
                    {...register('translations.ar.title')}
                    dir="rtl"
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="العنوان بالعربية..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description (Arabe)</label>
                  <textarea 
                    {...register('translations.ar.description')}
                    dir="rtl"
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="الوصف بالعربية..."
                  />
                </div>
              </div>
            )}

            {activeLang === 'en' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Title (English)</label>
                  <input 
                    {...register('translations.en.title')}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Title in English..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Description (English)</label>
                  <textarea 
                    {...register('translations.en.description')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Description in English..."
                  />
                </div>
              </div>
            )}

            {activeLang === 'de' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Titel (Deutsch)</label>
                  <input 
                    {...register('translations.de.title')}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Titel auf Deutsch..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Beschreibung (Deutsch)</label>
                  <textarea 
                    {...register('translations.de.description')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Detaillierte Beschreibung auf Deutsch..."
                  />
                </div>
              </div>
            )}

            {activeLang === 'es' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título (Español)</label>
                  <input 
                    {...register('translations.es.title')}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Título en español..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción (Español)</label>
                  <textarea 
                    {...register('translations.es.description')}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Descripción detallada en español..."
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Type d'offre</label>
              <select 
                {...register('type')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="sale">Vente</option>
                <option value="rent">Location</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Type de bien</label>
              <select 
                {...register('propertyType')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="apartment">Appartement</option>
                <option value="house">Maison</option>
                <option value="studio">Studio</option>
                <option value="office">Bureau</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Prix ({settings.currency})</label>
              <input 
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Superficie (m²)</label>
              <input 
                type="number"
                {...register('area', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Localisation</label>
            <input 
              {...register('location')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ex: Paris 8ème, Quartier de l'Europe"
            />
            {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Chambres</label>
              <input 
                type="number"
                {...register('bedrooms', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Salles de bain</label>
              <input 
                type="number"
                {...register('bathrooms', { valueAsNumber: true })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Contact</label>
            <input 
              {...register('whatsappNumber')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-bold text-gray-700">Photos</label>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${images.length >= MAX_IMAGES ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {images.length}/{MAX_IMAGES}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAiAutofill}
                disabled={autofilling || images.length === 0}
                className="flex items-center text-xs text-orange-600 font-bold hover:text-orange-700 disabled:opacity-50 transition-colors"
                title="Générer titre et description à partir des images"
              >
                {autofilling ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3 mr-1" />
                )}
                Remplissage Auto
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              {/* Upload Option with Multi-select and Drag & Drop */}
              <div 
                onClick={() => !uploading && images.length < MAX_IMAGES && fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!uploading && images.length < MAX_IMAGES) setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDragging(false);
                  if (!uploading && images.length < MAX_IMAGES && e.dataTransfer.files?.length) {
                    processFiles(Array.from(e.dataTransfer.files));
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center transition-all cursor-pointer group select-none text-center ${
                  isDragging ? 'border-orange-500 bg-orange-100/60 scale-[1.01]' :
                  uploading ? 'border-orange-500 bg-orange-50' : 
                  images.length >= MAX_IMAGES ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60' :
                  'border-gray-200 hover:border-orange-500 hover:bg-orange-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden" 
                  accept="image/*"
                  multiple
                  disabled={uploading || images.length >= MAX_IMAGES}
                />
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16 mb-3">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200 stroke-current"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-orange-600 stroke-current"
                          strokeWidth="3"
                          strokeDasharray={`${uploadProgress}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-600">{uploadProgress}%</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-orange-600">
                      {uploadStatusText || 'Importation des photos en cours...'}
                    </p>
                    <p className="text-xs text-orange-400 mt-1">Compression et optimisation automatique</p>
                  </div>
                ) : (
                  <>
                    <div className={`p-3 rounded-2xl mb-2 transition-transform group-hover:scale-110 ${
                      images.length >= MAX_IMAGES ? 'bg-gray-100 text-gray-400' : 'bg-orange-100/70 text-orange-600'
                    }`}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                      {images.length >= MAX_IMAGES 
                        ? 'Limite de photos atteinte' 
                        : 'Importer des photos (Sélection multiple)'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      Cliquez pour choisir plusieurs fichiers (Ctrl/Cmd + clic) ou glissez-déposez vos photos ici
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] text-orange-700 bg-orange-100/70 font-medium px-2 py-0.5 rounded-md">
                        Multi-sélection activée
                      </span>
                      <span className="text-[11px] text-gray-400">
                        PNG, JPG, WebP
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* URL Option */}
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  disabled={images.length >= MAX_IMAGES}
                  className="flex-grow px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 text-sm"
                  placeholder={images.length >= MAX_IMAGES ? "Limite de photos atteinte" : "Ou collez un lien direct d'image..."}
                />
                <button 
                  type="button"
                  onClick={addImage}
                  disabled={images.length >= MAX_IMAGES}
                  className="bg-gray-900 text-white p-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                  title="Ajouter par lien"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length === 0 && (
                <div className="col-span-4 py-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="w-8 h-8 mb-2" />
                  <span className="text-xs">Aucune image ajoutée</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Vidéo (URL YouTube)</label>
              <input 
                {...register('videoUrl')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://youtube.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Visite Virtuelle (URL)</label>
              <input 
                {...register('virtualTourUrl')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="https://matterport.com/..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Statut</label>
            <select 
              {...register('status')}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="available">Disponible</option>
              <option value="sold">Vendu</option>
              <option value="rented">Loué</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Équipements</label>
            <div className="flex gap-2 mb-4">
              <input 
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                className="flex-grow px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ex: Piscine, Garage, WiFi..."
              />
              <button 
                type="button"
                onClick={addAmenity}
                className="bg-gray-900 text-white p-3 rounded-xl hover:bg-black transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, i) => (
                <div key={i} className="flex items-center bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                  {amenity}
                  <button 
                    type="button"
                    onClick={() => removeAmenity(i)}
                    className="ml-2 text-orange-400 hover:text-orange-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {amenities.length === 0 && (
                <span className="text-xs text-gray-400 italic">Aucun équipement ajouté</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-100 flex justify-end">
        <button 
          type="submit"
          disabled={loading}
          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{listing ? 'Mettre à jour' : 'Publier l\'annonce'}</span>
        </button>
      </div>
    </form>
  );
}
