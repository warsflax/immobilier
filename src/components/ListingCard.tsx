import { Link } from 'react-router-dom';
import { Listing } from '../types';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import { useLanguage } from '../LanguageContext';
import { useSettings } from '../SettingsContext';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  
  const displayTitle = listing.translations?.[language]?.title || listing.title;
  const { isRTL } = useLanguage();

  const formattedPrice = `${listing.price.toLocaleString('fr-FR')} ${settings.currency}`;

  return (
    <Link 
      to={`/listing/${listing.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'} 
          alt={displayTitle}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {listing.status === 'available' ? (
            <span 
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white`}
              style={listing.type === 'sale' ? { backgroundColor: settings.primaryColor } : { backgroundColor: '#2563eb' }}
            >
              {listing.type === 'sale' ? t('card.for_sale') : t('card.for_rent')}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-900 text-white">
              {listing.status === 'sold' ? t('card.sold') : t('card.rented')}
            </span>
          )}
        </div>
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-lg font-bold text-gray-900 shadow-sm">
            {formattedPrice}{listing.type === 'rent' ? t('card.month') : ''}
          </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center text-gray-400 text-xs uppercase tracking-widest mb-2 font-bold">
          <span>{t(`home.${listing.propertyType}`)}</span>
          <span className="mx-2 text-gray-200">•</span>
          <span className="flex items-center">
            <MapPin className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
            {listing.location}
          </span>
        </div>
        
        <h3 
          className="text-xl font-bold text-gray-900 mb-4 line-clamp-1 transition-colors group-hover:text-[var(--hover-color)]"
          style={{ '--hover-color': settings.primaryColor } as any}
        >
          {displayTitle}
        </h3>

        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 mt-auto">
          <div className="flex flex-col items-center text-gray-500">
            <Bed className="w-4 h-4 mb-1" />
            <span className="text-xs font-bold">{listing.bedrooms} {t('card.bedrooms')}</span>
          </div>
          <div className="flex flex-col items-center text-gray-500">
            <Bath className="w-4 h-4 mb-1" />
            <span className="text-xs font-bold">{listing.bathrooms} {t('card.bathrooms')}</span>
          </div>
          <div className="flex flex-col items-center text-gray-500">
            <Square className="w-4 h-4 mb-1" />
            <span className="text-xs font-bold">{listing.area} m²</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
