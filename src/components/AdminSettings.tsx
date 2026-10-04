import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSettings } from '../SettingsContext';
import { AppSettings } from '../types';
import { Save, Loader2, Globe, Layout, Mail, Phone, MapPin, Image as ImageIcon, Languages } from 'lucide-react';
import { translations } from '../LanguageContext';

const settingsSchema = z.object({
  appName: z.string().min(2, 'Le nom doit faire au moins 2 caractères'),
  appLogo: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Couleur hexadécimale invalide'),
  heroImage: z.string().url('URL d\'image invalide'),
  currency: z.string().min(1, 'Symbole monétaire requis'),
  heroTitle: z.string().min(5, 'Le titre doit faire au moins 5 caractères'),
  heroSubtitle: z.string().min(10, 'Le sous-titre doit faire au moins 10 caractères'),
  listingsTitle: z.string().min(3, 'Le titre des annonces doit faire au moins 3 caractères'),
  translations: z.object({
    ar: z.object({
      heroTitle: z.string().min(5).optional().or(z.literal('')),
      heroSubtitle: z.string().min(10).optional().or(z.literal('')),
      listingsTitle: z.string().min(3).optional().or(z.literal('')),
    }).optional(),
    en: z.object({
      heroTitle: z.string().min(5).optional().or(z.literal('')),
      heroSubtitle: z.string().min(10).optional().or(z.literal('')),
      listingsTitle: z.string().min(3).optional().or(z.literal('')),
    }).optional(),
    de: z.object({
      heroTitle: z.string().min(5).optional().or(z.literal('')),
      heroSubtitle: z.string().min(10).optional().or(z.literal('')),
      listingsTitle: z.string().min(3).optional().or(z.literal('')),
    }).optional(),
    es: z.object({
      heroTitle: z.string().min(5).optional().or(z.literal('')),
      heroSubtitle: z.string().min(10).optional().or(z.literal('')),
      listingsTitle: z.string().min(3).optional().or(z.literal('')),
    }).optional(),
  }).optional(),
  contactEmail: z.string().email('Email invalide'),
  contactPhone: z.string().min(5, 'Téléphone requis'),
  address: z.string().min(5, 'Adresse requise'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeLang, setActiveLang] = useState<'fr' | 'ar' | 'en' | 'de' | 'es'>('fr');

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...settings,
      translations: settings.translations || {
        ar: { heroTitle: '', heroSubtitle: '', listingsTitle: '' },
        en: { heroTitle: '', heroSubtitle: '', listingsTitle: '' },
        de: { heroTitle: '', heroSubtitle: '', listingsTitle: '' },
        es: { heroTitle: '', heroSubtitle: '', listingsTitle: '' },
      },
    },
  });

  const primaryColor = watch('primaryColor');

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('primaryColor', e.target.value, { shouldValidate: true });
  };

  const onSubmit = async (data: SettingsFormData) => {
    setLoading(true);
    setSuccess(false);
    try {
      await setDoc(doc(db, 'settings', 'global'), data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Branding & Style */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-orange-600" />
            Identité & Style
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nom de l'application</label>
              <input 
                {...register('appName')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {errors.appName && <p className="text-red-500 text-xs mt-1">{errors.appName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">URL du Logo (Optionnel)</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  {...register('appLogo')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Couleur Principale (Hex)</label>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input 
                    type="color"
                    value={primaryColor}
                    onChange={handleColorChange}
                    className="h-12 w-12 rounded-xl border border-gray-100 cursor-pointer overflow-hidden p-0"
                  />
                </div>
                <input 
                  {...register('primaryColor')}
                  className="flex-grow px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  placeholder="#ea580c"
                />
                <button 
                  type="button"
                  onClick={() => {
                    // This provides the visual confirmation the user wants
                    const colorInput = document.querySelector('input[type="color"]') as HTMLInputElement;
                    if (colorInput) {
                      setValue('primaryColor', colorInput.value, { shouldValidate: true });
                    }
                  }}
                  className="px-4 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all active:scale-95"
                >
                  Appliquer
                </button>
              </div>
              {errors.primaryColor && <p className="text-red-500 text-xs mt-1">{errors.primaryColor.message}</p>}
              <p className="text-[10px] text-gray-400 mt-2 italic">
                * Cliquez sur le carré pour choisir, puis sur "Appliquer" pour valider le code Hex.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Devise (Symbole)</label>
              <input 
                {...register('currency')}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="€, $, DZD..."
              />
              {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Layout className="w-5 h-5 mr-2 text-orange-600" />
              Page d'accueil (Hero)
            </h3>
            <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
              {(['fr', 'ar', 'en', 'de', 'es'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
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

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Image de fond (URL)</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  {...register('heroImage')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="https://..."
                />
              </div>
              {errors.heroImage && <p className="text-red-500 text-xs mt-1">{errors.heroImage.message}</p>}
            </div>

            {activeLang === 'fr' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Titre Principal (FR)</label>
                  <input 
                    {...register('heroTitle')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {errors.heroTitle && <p className="text-red-500 text-xs mt-1">{errors.heroTitle.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sous-titre (FR)</label>
                  <textarea 
                    {...register('heroSubtitle')}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {errors.heroSubtitle && <p className="text-red-500 text-xs mt-1">{errors.heroSubtitle.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Titre de la section Annonces (FR)</label>
                  <input 
                    {...register('listingsTitle')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {errors.listingsTitle && <p className="text-red-500 text-xs mt-1">{errors.listingsTitle.message}</p>}
                </div>
              </div>
            )}

          {activeLang === 'ar' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Titre Principal (AR)</label>
                <input 
                  {...register('translations.ar.heroTitle')}
                  dir="rtl"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sous-titre (AR)</label>
                <textarea 
                  {...register('translations.ar.heroSubtitle')}
                  dir="rtl"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Titre de la section Annonces (AR)</label>
                <input 
                  {...register('translations.ar.listingsTitle')}
                  dir="rtl"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-arabic focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {activeLang === 'en' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hero Title (EN)</label>
                <input 
                  {...register('translations.en.heroTitle')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Hero Subtitle (EN)</label>
                <textarea 
                  {...register('translations.en.heroSubtitle')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Listings Title (EN)</label>
                <input 
                  {...register('translations.en.listingsTitle')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          {activeLang === 'de' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Haupttitel (DE)</label>
                <input 
                  {...register('translations.de.heroTitle')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ex: Finden Sie Ihr Traumhaus..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Untertitel (DE)</label>
                <textarea 
                  {...register('translations.de.heroSubtitle')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Entdecken Sie unsere exklusive Auswahl..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Titel des Immobilienbereichs (DE)</label>
                <input 
                  {...register('translations.de.listingsTitle')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Neueste Angebote"
                />
              </div>
            </div>
          )}

          {activeLang === 'es' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Título Principal (ES)</label>
                <input 
                  {...register('translations.es.heroTitle')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Encuentra el hogar de tus sueños..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subtítulo (ES)</label>
                <textarea 
                  {...register('translations.es.heroSubtitle')}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Descubre nuestra exclusiva selección..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Título de la sección Anuncios (ES)</label>
                <input 
                  {...register('translations.es.listingsTitle')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Anuncios recientes"
                />
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Contact Info */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-orange-600" />
            Informations de contact
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email de contact</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  {...register('contactEmail')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  {...register('contactPhone')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">Adresse physique</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  {...register('address')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          {success && (
            <span className="text-green-600 font-semibold animate-pulse">
              Paramètres enregistrés avec succès !
            </span>
          )}
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-orange-200 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Enregistrer les modifications</span>
          </button>
        </div>
      </form>
    </div>
  );
}
