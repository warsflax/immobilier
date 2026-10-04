import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing } from '../types';
import { 
  MapPin, Bed, Bath, Square, MessageCircle, 
  ChevronLeft, ChevronRight, Maximize2, 
  CheckCircle2, Video, ExternalLink,
  Camera, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useSettings } from '../SettingsContext';

export default function ListingDetails() {
  const { id } = useParams();
  const { t, language, isRTL } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Touch swipe support for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isRTL) {
      if (isLeftSwipe) handlePrevImage();
      if (isRightSwipe) handleNextImage();
    } else {
      if (isLeftSwipe) handleNextImage();
      if (isRightSwipe) handlePrevImage();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handlePrevImage = () => {
    if (!listing?.images?.length) return;
    setCurrentImage(prev => (prev > 0 ? prev - 1 : listing.images.length - 1));
  };

  const handleNextImage = () => {
    if (!listing?.images?.length) return;
    setCurrentImage(prev => (prev < listing.images.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!listing?.images || listing.images.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        isRTL ? handleNextImage() : handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        isRTL ? handlePrevImage() : handleNextImage();
      } else if (e.key === 'Escape' && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, isRTL, listing?.images?.length]);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setListing({ id: docSnap.id, ...docSnap.data() } as Listing);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderTopColor: settings.primaryColor, borderBottomColor: settings.primaryColor }}
        ></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('details.not_found')}</h2>
        <button 
          onClick={() => navigate('/')}
          className="text-white px-6 py-2 rounded-xl font-bold shadow-md"
          style={{ backgroundColor: settings.primaryColor }}
        >
          {t('details.back')}
        </button>
      </div>
    );
  }

  const formattedPrice = `${listing.price.toLocaleString('fr-FR')} ${settings.currency}`;

  const displayTitle = listing.translations?.[language]?.title || listing.title;
  const displayDescription = listing.translations?.[language]?.description || listing.description;

  const whatsappUrl = `https://wa.me/${(listing.whatsappNumber || '').replace(/\s/g, '')}?text=${encodeURIComponent(`Bonjour, je suis intéressé par l'annonce : ${displayTitle} (${window.location.href})`)}`;

  return (
    <div className={`bg-gray-50 min-h-screen pb-20 ${isRTL ? 'font-arabic' : ''}`}>
      {/* Main Image Gallery Hero */}
      <section 
        className="relative h-[50vh] sm:h-[60vh] lg:h-[65vh] bg-black overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {listing.images && listing.images.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={listing.images[currentImage]}
              alt={`${displayTitle} - ${currentImage + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500">
            No images available
          </div>
        )}
        
        {/* Soft atmospheric gradient overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/20 to-black/40"></div>
        
        {/* Top Controls Bar */}
        <div className="absolute top-4 inset-x-3 sm:inset-x-6 lg:inset-x-8 max-w-7xl mx-auto flex items-center justify-between z-20 pointer-events-none">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="pointer-events-auto px-3.5 py-2 bg-black/50 hover:bg-black/80 text-white rounded-xl text-xs sm:text-sm font-bold backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
          >
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{t('details.back')}</span>
          </button>

          {listing.images && listing.images.length > 0 && (
            <div className="pointer-events-auto flex items-center gap-2">
              <span className="bg-black/60 backdrop-blur-md text-white text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full border border-white/20 shadow-lg flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>{currentImage + 1} / {listing.images.length}</span>
              </span>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                title={t('details.fullscreen')}
                className="p-2 sm:p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Prominent Next & Previous Navigation Buttons (Centrally aligned on both PC & Mobile) */}
        {listing.images && listing.images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                isRTL ? handleNextImage() : handlePrevImage();
              }}
              aria-label={t('details.prev_photo')}
              className="absolute left-2.5 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/55 hover:bg-black/85 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/25 shadow-2xl hover:scale-110 active:scale-95"
            >
              {isRTL ? <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" /> : <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                isRTL ? handlePrevImage() : handleNextImage();
              }}
              aria-label={t('details.next_photo')}
              className="absolute right-2.5 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/55 hover:bg-black/85 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/25 shadow-2xl hover:scale-110 active:scale-95"
            >
              {isRTL ? <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" /> : <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </>
        )}

        {/* Bottom Hero Info: Badges, Title, Location */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto z-10 pointer-events-none">
          <div className="text-white max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
              {listing.status === 'available' ? (
                <span 
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md"
                  style={listing.type === 'sale' ? { backgroundColor: settings.primaryColor } : { backgroundColor: '#2563eb' }}
                >
                  {listing.type === 'sale' ? t('card.for_sale') : t('card.for_rent')}
                </span>
              ) : (
                <span className="bg-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-md">
                  {listing.status === 'sold' ? t('card.sold') : t('card.rented')}
                </span>
              )}
              <span className="bg-white/25 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white border border-white/20">
                {t(`home.${listing.propertyType}`)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-md">
              {displayTitle}
            </h1>
            <div className="flex items-center text-gray-200 text-sm sm:text-base drop-shadow-sm">
              <MapPin className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'} text-orange-400 flex-shrink-0`} />
              <span>{listing.location}</span>
            </div>
          </div>
        </div>

        {/* Mobile Swipe Indicators (dots) */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-1.5 inset-x-0 flex justify-center items-center gap-1.5 z-20 md:hidden pointer-events-none">
            {listing.images.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentImage === idx 
                    ? 'w-6 bg-white shadow-md' 
                    : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Interactive Thumbnails Bar (Always visible for both Mobile & Desktop) */}
      {listing.images && listing.images.length > 1 && (
        <div className="bg-gray-950 border-b border-gray-800 px-4 py-2.5 sm:py-3 shadow-inner">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Scrollable Thumbnails */}
            <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 flex-1">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImage(idx)}
                  className={`relative flex-shrink-0 w-14 h-10 sm:w-20 sm:h-14 rounded-xl overflow-hidden transition-all duration-200 border-2 ${
                    currentImage === idx 
                      ? 'border-white scale-105 shadow-lg shadow-black/60 opacity-100' 
                      : 'border-transparent opacity-50 hover:opacity-85'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Miniature ${idx + 1}`} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  {currentImage === idx && (
                    <div 
                      className="absolute inset-x-0 bottom-0 h-1"
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* View Full Gallery Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="flex-shrink-0 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 border border-white/15"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('details.all_photos')}</span>
              <span>({listing.images.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && listing.images && listing.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Lightbox Header */}
            <div className="p-4 sm:p-6 flex items-center justify-between text-white border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="bg-white/15 px-3 py-1 rounded-full text-xs font-bold tracking-wider">
                  {currentImage + 1} / {listing.images.length}
                </span>
                <span className="text-sm sm:text-base font-semibold truncate max-w-md hidden sm:inline text-white/90">
                  {displayTitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={t('details.close')}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lightbox Main Stage */}
            <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
              {/* Prev Button */}
              {listing.images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    isRTL ? handleNextImage() : handlePrevImage();
                  }}
                  className="absolute left-3 sm:left-6 z-10 p-3 sm:p-4 rounded-full bg-black/55 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-2xl"
                  aria-label={t('details.prev_photo')}
                >
                  {isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
                </button>
              )}

              {/* Main Image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  src={listing.images[currentImage]}
                  alt={`${displayTitle} - ${currentImage + 1}`}
                  className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Next Button */}
              {listing.images.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    isRTL ? handlePrevImage() : handleNextImage();
                  }}
                  className="absolute right-3 sm:right-6 z-10 p-3 sm:p-4 rounded-full bg-black/55 hover:bg-black/85 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-2xl"
                  aria-label={t('details.next_photo')}
                >
                  {isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                </button>
              )}
            </div>

            {/* Lightbox Bottom Thumbnails Strip */}
            <div className="p-4 bg-black/70 border-t border-white/10">
              <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
                {listing.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentImage(idx)}
                    className={`relative flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden transition-all duration-200 border-2 ${
                      currentImage === idx 
                        ? 'border-white scale-105 shadow-md ring-2 ring-white/50 opacity-100' 
                        : 'border-transparent opacity-40 hover:opacity-80'
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`Photo ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-8 mb-8 pb-8 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${settings.primaryColor}10`, color: settings.primaryColor }}
                  >
                    <Bed className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('details.bedrooms')}</p>
                    <p className="text-lg font-bold text-gray-900">{listing.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${settings.primaryColor}10`, color: settings.primaryColor }}
                  >
                    <Bath className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('details.bathrooms')}</p>
                    <p className="text-lg font-bold text-gray-900">{listing.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${settings.primaryColor}10`, color: settings.primaryColor }}
                  >
                    <Square className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('details.area')}</p>
                    <p className="text-lg font-bold text-gray-900">{listing.area} m²</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-orange max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{t('details.description')}</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </p>
              </div>

              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('details.amenities')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {listing.amenities?.map((amenity, i) => (
                    <div key={i} className="flex items-center space-x-2 text-gray-600">
                      <CheckCircle2 className="w-5 h-5" style={{ color: settings.primaryColor }} />
                      <span>{amenity}</span>
                    </div>
                  ))}
                  {(!listing.amenities || listing.amenities.length === 0) && (
                    <p className="text-gray-400 italic">{t('details.no_amenities')}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Virtual Tour / Video */}
            {(listing.virtualTourUrl || listing.videoUrl) && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Video className={`w-6 h-6 ${isRTL ? 'ml-2' : 'mr-2'}`} style={{ color: settings.primaryColor }} />
                  {t('details.virtual_tour')}
                </h3>
                <div className="space-y-6">
                  {listing.virtualTourUrl && (
                    <div>
                      <button 
                        onClick={() => setShowVirtualTour(!showVirtualTour)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center">
                          <Maximize2 className={`w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'} text-orange-600`} />
                          <span className="font-semibold text-gray-900">{t('details.3d_tour')}</span>
                        </div>
                        <ExternalLink className={`w-5 h-5 text-gray-400 group-hover:text-orange-600 ${isRTL ? 'rotate-180' : ''}`} />
                      </button>
                      {showVirtualTour && (
                        <div className="mt-4 aspect-video rounded-2xl overflow-hidden border border-gray-200">
                          <iframe 
                            src={listing.virtualTourUrl} 
                            className="w-full h-full"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}
                    </div>
                  )}
                  {listing.videoUrl && (
                    <div className="aspect-video rounded-2xl overflow-hidden border border-gray-200">
                      <iframe 
                        src={listing.videoUrl.replace('watch?v=', 'embed/')} 
                        className="w-full h-full"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 sticky top-24">
              <div className="mb-8">
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{t('details.price')}</p>
                <p className="text-4xl font-black text-gray-900">
                  {formattedPrice}
                  {listing.type === 'rent' && <span className="text-lg font-normal text-gray-500">{t('card.month')}</span>}
                </p>
              </div>

              <div className="space-y-4">
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-green-200"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span>{t('details.contact_whatsapp')}</span>
                </a>
                <button className="w-full py-4 rounded-2xl font-bold text-gray-700 border-2 border-gray-100 hover:border-orange-600 hover:text-orange-600 transition-all">
                  {t('details.book_appointment')}
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    <img src="https://i.pravatar.cc/150?u=agent" alt="Agent" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{settings.appName}</p>
                    <p className="text-sm text-gray-500">{t('details.agent_title')}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Publié par:</span>
                    <span className="text-gray-700 font-semibold">{listing.createdByEmail || 'Administrateur'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Le:</span>
                    <span className="text-gray-700 font-semibold">{new Date(listing.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
