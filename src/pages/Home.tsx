import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, getDocs, orderBy, limit, startAfter, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';
import { Listing, PropertyType } from '../types';
import ListingCard from '../components/ListingCard';
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Home as HomeIcon, 
  ChevronRight, 
  ChevronDown,
  X, 
  Loader2, 
  Bed, 
  Bath, 
  Square, 
  Tag, 
  KeyRound, 
  Layers, 
  ArrowUpDown,
  RotateCcw,
  Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../SettingsContext';
import { useLanguage } from '../LanguageContext';

const PAGE_SIZE = 18;

export default function Home() {
  const { settings } = useSettings();
  const { t, isRTL, language } = useLanguage();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(false);

  // Filter states
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'rent'>('all');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minArea, setMinArea] = useState<number | ''>('');
  const [maxArea, setMaxArea] = useState<number | ''>('');
  const [bedroomsFilter, setBedroomsFilter] = useState<number | 'all'>('all');
  const [bathroomsFilter, setBathroomsFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'area_desc'>('recent');
  
  const [showFilters, setShowFilters] = useState(false);

  const heroTitle = settings.translations?.[language as 'ar' | 'en' | 'de' | 'es']?.heroTitle || settings.heroTitle;
  const heroSubtitle = settings.translations?.[language as 'ar' | 'en' | 'de' | 'es']?.heroSubtitle || settings.heroSubtitle;
  const listingsTitle = settings.translations?.[language as 'ar' | 'en' | 'de' | 'es']?.listingsTitle || settings.listingsTitle;

  const fetchListings = useCallback(async (isNextPage = false) => {
    if (!isNextPage) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

      if (isNextPage && lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      constraints.push(limit(PAGE_SIZE));

      const q = query(collection(db, 'listings'), ...constraints);
      const snapshot = await getDocs(q);
      
      const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      
      if (isNextPage) {
        setListings(prev => [...prev, ...newItems]);
      } else {
        setListings(newItems);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastDoc]);

  useEffect(() => {
    fetchListings();
  }, []);

  // Extract available unique cities from listings
  const availableCities = useMemo(() => {
    const cityMap = new Map<string, number>();
    listings.forEach(l => {
      if (l.location) {
        const parts = l.location.split(',').map(s => s.trim());
        parts.forEach(part => {
          if (part.length > 2 && isNaN(Number(part))) {
            const normalized = part.charAt(0).toUpperCase() + part.slice(1);
            cityMap.set(normalized, (cityMap.get(normalized) || 0) + 1);
          }
        });
      }
    });
    return Array.from(cityMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 6);
  }, [listings]);

  // Comprehensive client-side filtering and sorting
  const finalFilteredListings = useMemo(() => {
    return listings
      .filter(listing => {
        // 1. Transaction Type (sale / rent / all)
        if (typeFilter !== 'all' && listing.type !== typeFilter) {
          return false;
        }

        // 2. Property Type (apartment / house / studio / office)
        if (propertyTypeFilter !== 'all' && listing.propertyType !== propertyTypeFilter) {
          return false;
        }

        // 3. City filter
        if (cityFilter.trim()) {
          const c = cityFilter.toLowerCase().trim();
          if (!(listing.location || '').toLowerCase().includes(c)) {
            return false;
          }
        }

        // 4. Price Min & Max
        if (minPrice !== '' && listing.price < Number(minPrice)) {
          return false;
        }
        if (maxPrice !== '' && listing.price > Number(maxPrice)) {
          return false;
        }

        // 5. Surface Min & Max
        if (minArea !== '' && listing.area < Number(minArea)) {
          return false;
        }
        if (maxArea !== '' && listing.area > Number(maxArea)) {
          return false;
        }

        // 6. Bedrooms
        if (bedroomsFilter !== 'all' && listing.bedrooms < bedroomsFilter) {
          return false;
        }

        // 7. Bathrooms / Toilettes
        if (bathroomsFilter !== 'all' && listing.bathrooms < bathroomsFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'area_desc') return b.area - a.area;
        // Default: recent
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [
    listings,
    typeFilter,
    propertyTypeFilter,
    cityFilter,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    bedroomsFilter,
    bathroomsFilter,
    sortBy
  ]);

  // Count active filters (excluding default)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (propertyTypeFilter !== 'all') count++;
    if (cityFilter.trim()) count++;
    if (minPrice !== '') count++;
    if (maxPrice !== '') count++;
    if (minArea !== '') count++;
    if (maxArea !== '') count++;
    if (bedroomsFilter !== 'all') count++;
    if (bathroomsFilter !== 'all') count++;
    if (sortBy !== 'recent') count++;
    return count;
  }, [typeFilter, propertyTypeFilter, cityFilter, minPrice, maxPrice, minArea, maxArea, bedroomsFilter, bathroomsFilter, sortBy]);

  const resetFilters = () => {
    setTypeFilter('all');
    setPropertyTypeFilter('all');
    setCityFilter('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setBedroomsFilter('all');
    setBathroomsFilter('all');
    setSortBy('recent');
  };

  return (
    <div className={`bg-white ${isRTL ? 'font-arabic' : ''}`}>
      {/* Hero Section */}
      <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden py-20 px-4">
        <div className="absolute inset-0 z-0">
          <img 
            src={settings.heroImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80"} 
            alt="Hero" 
            className="w-full h-full object-cover brightness-[0.35]"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight"
          >
            {heroTitle}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-200 mb-8 font-light max-w-2xl mx-auto"
          >
            {heroSubtitle}
          </motion.p>

          {/* Transaction Type Segmented Switcher & Quick Filter CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto"
          >
            {/* Segmented Switcher (Tout / Vente / Location) */}
            <div className="inline-flex bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-xl w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  typeFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-md scale-102'
                    : 'text-white hover:text-white/80 hover:bg-white/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>{t('home.all_badge')}</span>
              </button>
              
              <button
                type="button"
                onClick={() => setTypeFilter('sale')}
                className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  typeFilter === 'sale'
                    ? 'bg-white text-gray-900 shadow-md scale-102'
                    : 'text-white hover:text-white/80 hover:bg-white/10'
                }`}
              >
                <Tag className="w-4 h-4 text-orange-600" />
                <span>{t('home.for_sale_badge')}</span>
              </button>

              <button
                type="button"
                onClick={() => setTypeFilter('rent')}
                className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  typeFilter === 'rent'
                    ? 'bg-white text-gray-900 shadow-md scale-102'
                    : 'text-white hover:text-white/80 hover:bg-white/10'
                }`}
              >
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>{t('home.for_rent_badge')}</span>
              </button>
            </div>

            {/* Filter Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setShowFilters(true);
                const bar = document.getElementById('filters-bar');
                if (bar) bar.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 border border-white/20 backdrop-blur-md"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{t('home.filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-orange-600 text-xs font-black ml-1 shadow-sm">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </motion.div>

          {/* Quick Property Type Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-5"
          >
            {(['apartment', 'house', 'studio', 'office'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setPropertyTypeFilter(propertyTypeFilter === type ? 'all' : type);
                  const results = document.getElementById('listings-results');
                  if (results) results.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all ${
                  propertyTypeFilter === type
                    ? 'bg-white text-gray-900 shadow-lg font-bold scale-105'
                    : 'bg-black/35 text-white/90 border border-white/20 hover:bg-white/20'
                }`}
              >
                {t(`home.${type}s`)}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sticky Filters Bar */}
      <div id="filters-bar" className="bg-gray-50 border-b border-gray-200/80 sticky top-[72px] z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          {/* Top Row: Quick Tabs + Filter Button */}
          <div className="flex items-center justify-between gap-3">
            {/* Property Types Quick Tabs (Horizontal scroll on mobile) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1 mr-1">
              <button 
                onClick={() => setPropertyTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  propertyTypeFilter === 'all' 
                    ? 'text-white shadow-sm' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
                style={propertyTypeFilter === 'all' ? { backgroundColor: settings.primaryColor } : {}}
              >
                {t('home.all')}
              </button>
              {(['apartment', 'house', 'studio', 'office'] as const).map(type => (
                <button 
                  key={type}
                  onClick={() => setPropertyTypeFilter(propertyTypeFilter === type ? 'all' : type)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                    propertyTypeFilter === type 
                      ? 'text-white shadow-sm' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                  style={propertyTypeFilter === type ? { backgroundColor: settings.primaryColor } : {}}
                >
                  {t(`home.${type}s`)}
                </button>
              ))}
            </div>
            
            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-bold text-gray-500 hover:text-red-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
                  title={t('home.reset')}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('home.reset')}</span>
                </button>
              )}

              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                  showFilters || activeFiltersCount > 0
                    ? 'text-white shadow-md'
                    : 'bg-gray-900 text-white hover:bg-black'
                }`}
                style={showFilters || activeFiltersCount > 0 ? { backgroundColor: settings.primaryColor } : {}}
              >
                <SlidersHorizontal className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span>{t('home.filters')}</span>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-orange-600 text-[11px] font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filter Tags Bar (Horizontal scrollable chips) */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 mt-1.5 border-t border-gray-200/60 text-xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{t('home.active_filters')}:</span>
              
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap flex-shrink-0">
                  {typeFilter === 'sale' ? t('home.sale') : t('home.rent')}
                  <button type="button" onClick={() => setTypeFilter('all')} className="hover:text-red-500 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {propertyTypeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap flex-shrink-0">
                  {t(`home.${propertyTypeFilter}`)}
                  <button type="button" onClick={() => setPropertyTypeFilter('all')} className="hover:text-red-500 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {cityFilter && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap flex-shrink-0">
                  <MapPin className="w-3 h-3 text-orange-600" />
                  {cityFilter}
                  <button type="button" onClick={() => setCityFilter('')} className="hover:text-red-500 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(minPrice !== '' || maxPrice !== '') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap flex-shrink-0">
                  {minPrice !== '' ? `${minPrice} ${settings.currency}` : '0'} - {maxPrice !== '' ? `${maxPrice} ${settings.currency}` : '∞'}
                  <button type="button" onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="hover:text-red-500 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {(minArea !== '' || maxArea !== '') && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap flex-shrink-0">
                  {minArea !== '' ? `${minArea} m²` : '0 m²'} - {maxArea !== '' ? `${maxArea} m²` : '∞'}
                  <button type="button" onClick={() => { setMinArea(''); setMaxArea(''); }} className="hover:text-red-500 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {bedroomsFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap flex-shrink-0">
                  <Bed className="w-3 h-3 text-orange-600" />
                  {bedroomsFilter}+
                  <button type="button" onClick={() => setBedroomsFilter('all')} className="hover:text-red-500 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {bathroomsFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-xs whitespace-nowrap flex-shrink-0">
                  <Bath className="w-3 h-3 text-orange-600" />
                  {bathroomsFilter}+
                  <button type="button" onClick={() => setBathroomsFilter('all')} className="hover:text-red-500 p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 whitespace-nowrap underline ml-1"
              >
                {t('home.clear_filters')}
              </button>
            </div>
          )}

          {/* DESKTOP FILTER DRAWER (hidden on mobile, shown on md+) */}
          <div className="hidden md:block">
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="pt-5 pb-2 border-t border-gray-200 mt-3 space-y-5">
                    {/* Grid of Main Filters: Ville, Prix, Surface */}
                    <div className="grid grid-cols-3 gap-6">
                      {/* 1. VILLE */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <MapPin className="w-3.5 h-3.5 text-orange-600" /> 
                          {t('home.city')}
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Ex: Casablanca, Marrakech, Tanger..." 
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs font-medium"
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                          />
                          <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          {cityFilter && (
                            <button 
                              type="button" 
                              onClick={() => setCityFilter('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Popular city suggestions */}
                        {availableCities.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-gray-400 font-medium mr-1">{t('home.popular_cities')}:</span>
                            {availableCities.map(city => (
                              <button
                                key={city}
                                type="button"
                                onClick={() => setCityFilter(cityFilter === city ? '' : city)}
                                className={`text-xs px-2.5 py-0.5 rounded-lg transition-all ${
                                  cityFilter.toLowerCase() === city.toLowerCase()
                                    ? 'bg-orange-600 text-white font-bold'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {city}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. PRIX (MIN & MAX) */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Coins className="w-3.5 h-3.5 text-orange-600" /> 
                          {t('home.price')} ({settings.currency})
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              placeholder={t('home.min_price')}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs font-medium"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                              {settings.currency}
                            </span>
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              placeholder={t('home.max_price')}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs font-medium"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                              {settings.currency}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3. SURFACE (MIN & MAX) */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Square className="w-3.5 h-3.5 text-orange-600" /> 
                          {t('details.area')} (m²)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              placeholder={t('home.min_area')}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs font-medium"
                              value={minArea}
                              onChange={(e) => setMinArea(e.target.value ? Number(e.target.value) : '')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                              m²
                            </span>
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              min="0"
                              placeholder={t('home.max_area')}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs font-medium"
                              value={maxArea}
                              onChange={(e) => setMaxArea(e.target.value ? Number(e.target.value) : '')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">
                              m²
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Second Row: Chambres, Toilettes/SDB, Tri */}
                    <div className="grid grid-cols-3 gap-6 pt-2 border-t border-gray-100">
                      {/* 4. NOMBRE DE CHAMBRES */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Bed className="w-3.5 h-3.5 text-orange-600" /> 
                          {t('home.bedrooms_count')}
                        </label>
                        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
                          <button
                            type="button"
                            onClick={() => setBedroomsFilter('all')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              bedroomsFilter === 'all'
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {t('home.any')}
                          </button>
                          {[1, 2, 3, 4, 5].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBedroomsFilter(num)}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                bedroomsFilter === num
                                  ? 'bg-orange-600 text-white shadow-xs'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {num}{num === 5 ? '+' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 5. NOMBRE DE TOILETTES / SALLES DE BAIN */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <Bath className="w-3.5 h-3.5 text-orange-600" /> 
                          {t('home.bathrooms_count')}
                        </label>
                        <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
                          <button
                            type="button"
                            onClick={() => setBathroomsFilter('all')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                              bathroomsFilter === 'all'
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {t('home.any')}
                          </button>
                          {[1, 2, 3, 4].map(num => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setBathroomsFilter(num)}
                              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                bathroomsFilter === num
                                  ? 'bg-orange-600 text-white shadow-xs'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              {num}{num === 4 ? '+' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 6. TRIER PAR */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
                          <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" /> 
                          {t('home.sort_by')}
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs cursor-pointer"
                        >
                          <option value="recent">{t('home.sort_recent')}</option>
                          <option value="price_asc">{t('home.sort_price_asc')}</option>
                          <option value="price_desc">{t('home.sort_price_desc')}</option>
                          <option value="area_desc">{t('home.sort_area_desc')}</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions Bar inside Desktop Drawer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <button 
                        type="button"
                        onClick={resetFilters}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {t('home.reset')}
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500">
                          {finalFilteredListings.length} {t('home.available_homes')}
                        </span>
                        <button 
                          type="button"
                          onClick={() => setShowFilters(false)}
                          className="px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          style={{ backgroundColor: settings.primaryColor }}
                        >
                          {t('home.filter_results')} ({finalFilteredListings.length})
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET DRAWER (visible only on screens < md when showFilters is true) */}
      <AnimatePresence>
        {showFilters && (
          <div className="md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Bottom Sheet Card: Capped at max-h-[78vh], never takes over full screen */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[28px] shadow-2xl flex flex-col max-h-[78vh] border-t border-gray-100 overflow-hidden"
            >
              {/* Header with Grab Handle */}
              <div className="pt-2.5 pb-2.5 px-5 border-b border-gray-100 flex-shrink-0">
                <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-orange-600" />
                    <h3 className="font-bold text-gray-900 text-base">{t('home.filters')}</h3>
                    {activeFiltersCount > 0 && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Filter Options */}
              <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1 overscroll-contain">
                {/* 1. Transaction Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('home.property_type')} ({t('home.for_sale_badge')} / {t('home.for_rent_badge')})
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setTypeFilter('all')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        typeFilter === 'all'
                          ? 'bg-white text-gray-900 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{t('home.all_badge')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('sale')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        typeFilter === 'sale'
                          ? 'bg-white text-orange-600 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{t('home.for_sale_badge')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTypeFilter('rent')}
                      className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                        typeFilter === 'rent'
                          ? 'bg-white text-blue-600 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{t('home.for_rent_badge')}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Type de bien */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t('home.property_type')}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPropertyTypeFilter('all')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        propertyTypeFilter === 'all'
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t('home.all')}
                    </button>
                    {(['apartment', 'house', 'studio', 'office'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPropertyTypeFilter(propertyTypeFilter === type ? 'all' : type)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          propertyTypeFilter === type
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {t(`home.${type}s`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Ville */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    {t('home.city')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Casablanca, Marrakech, Tanger..."
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {cityFilter && (
                      <button
                        type="button"
                        onClick={() => setCityFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {availableCities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {availableCities.map(city => (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setCityFilter(cityFilter === city ? '' : city)}
                          className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                            cityFilter.toLowerCase() === city.toLowerCase()
                              ? 'bg-orange-600 text-white font-bold'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Budget / Prix */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1 uppercase tracking-wider">
                    <Coins className="w-3.5 h-3.5 text-orange-600" />
                    {t('home.price')} ({settings.currency})
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder={t('home.min_price')}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">
                        {settings.currency}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder={t('home.max_price')}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">
                        {settings.currency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5. Surface (m²) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1 uppercase tracking-wider">
                    <Square className="w-3.5 h-3.5 text-orange-600" />
                    {t('details.area')} (m²)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder={t('home.min_area')}
                        value={minArea}
                        onChange={(e) => setMinArea(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">
                        m²
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        placeholder={t('home.max_area')}
                        value={maxArea}
                        onChange={(e) => setMaxArea(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-semibold">
                        m²
                      </span>
                    </div>
                  </div>
                </div>

                {/* 6. Chambres */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1 uppercase tracking-wider">
                    <Bed className="w-3.5 h-3.5 text-orange-600" />
                    {t('home.bedrooms_count')}
                  </label>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBedroomsFilter('all')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        bedroomsFilter === 'all'
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('home.any')}
                    </button>
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBedroomsFilter(num)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          bedroomsFilter === num
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}{num === 5 ? '+' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 7. Salles de bain */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1 uppercase tracking-wider">
                    <Bath className="w-3.5 h-3.5 text-orange-600" />
                    {t('home.bathrooms_count')}
                  </label>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBathroomsFilter('all')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        bathroomsFilter === 'all'
                          ? 'bg-gray-900 text-white shadow-xs'
                          : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('home.any')}
                    </button>
                    {[1, 2, 3, 4].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setBathroomsFilter(num)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          bathroomsFilter === num
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {num}{num === 4 ? '+' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8. Trier par */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1 uppercase tracking-wider">
                    <ArrowUpDown className="w-3.5 h-3.5 text-orange-600" />
                    {t('home.sort_by')}
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    <option value="recent">{t('home.sort_recent')}</option>
                    <option value="price_asc">{t('home.sort_price_asc')}</option>
                    <option value="price_desc">{t('home.sort_price_desc')}</option>
                    <option value="area_desc">{t('home.sort_area_desc')}</option>
                  </select>
                </div>
              </div>

              {/* Fixed Footer with Action Buttons */}
              <div className="p-3.5 bg-white border-t border-gray-100 flex items-center gap-2.5 flex-shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('home.reset')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowFilters(false);
                    const resultsElement = document.getElementById('listings-results');
                    if (resultsElement) resultsElement.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold shadow-md shadow-orange-500/20 text-center transition-all"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  {t('home.filter_results')} ({finalFilteredListings.length})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid Section */}
      <section id="listings-results" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{listingsTitle}</h2>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              {t('home.showing_props')} <span className="font-bold text-orange-600">{finalFilteredListings.length}</span> {t('home.available_homes')}
            </p>
          </div>

          {/* Quick Sort Dropdown on right */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('home.sort_by')}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="recent">{t('home.sort_recent')}</option>
              <option value="price_asc">{t('home.sort_price_asc')}</option>
              <option value="price_desc">{t('home.sort_price_desc')}</option>
              <option value="area_desc">{t('home.sort_area_desc')}</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-50 animate-pulse rounded-3xl h-[450px]"></div>
            ))}
          </div>
        ) : finalFilteredListings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {finalFilteredListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min((index % 10) * 0.05, 0.3) }}
                >
                  <ListingCard listing={listing} />
                </motion.div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-16 flex justify-center">
                <button
                  onClick={() => fetchListings(true)}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-lg shadow-gray-200/50"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t('home.loading')}
                    </>
                  ) : (
                    <>
                      {t('home.view_more')}
                      <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[36px] border border-dashed border-gray-200 px-4">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-gray-200/50">
              <HomeIcon className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{t('home.no_results')}</h3>
            <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">
              {t('home.try_again')}
            </p>
            <button 
              onClick={resetFilters}
              className="mt-6 px-7 py-3 bg-white border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-colors shadow-sm text-sm"
            >
              {t('home.clear_filters')}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
