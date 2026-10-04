import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';

export type Language = 'fr' | 'ar' | 'en' | 'de' | 'es';

interface Translations {
  [key: string]: {
    [lang in Language]: string;
  };
}

export const translations: Translations = {
  // Navbar
  'nav.listings': { fr: 'Annonces', ar: 'الإعلانات', en: 'Listings', de: 'Immobilien', es: 'Propiedades' },
  'nav.dashboard': { fr: 'Dashboard', ar: 'لوحة القيادة', en: 'Dashboard', de: 'Dashboard', es: 'Panel de control' },
  'nav.logout': { fr: 'Déconnexion', ar: 'تسجيل الخروج', en: 'Logout', de: 'Abmelden', es: 'Cerrar sesión' },
  'nav.pro_space': { fr: 'Espace Pro', ar: 'فضاء المحترفين', en: 'Pro Space', de: 'Pro-Bereich', es: 'Espacio Pro' },
  
  // Home
  'home.search_placeholder': { fr: 'Ville, quartier, adresse...', ar: 'المدينة، الحي، العنوان...', en: 'City, neighborhood, address...', de: 'Stadt, Viertel, Adresse...', es: 'Ciudad, barrio, dirección...' },
  'home.all_types': { fr: 'Tous types', ar: 'كل الأنواع', en: 'All types', de: 'Alle Arten', es: 'Todos los tipos' },
  'home.sale': { fr: 'Vente', ar: 'بيع', en: 'Sale', de: 'Kauf', es: 'Venta' },
  'home.rent': { fr: 'Location', ar: 'كراء', en: 'Rent', de: 'Miete', es: 'Alquiler' },
  'home.search_btn': { fr: 'Rechercher', ar: 'بحث', en: 'Search', de: 'Suchen', es: 'Buscar' },
  'home.recent_listings': { fr: 'Annonces récentes', ar: 'أحدث الإعلانات', en: 'Recent Listings', de: 'Neueste Angebote', es: 'Anuncios recientes' },
  'home.available_homes': { fr: 'logements disponibles', ar: 'سكنات متوفرة', en: 'available homes', de: 'verfügbare Angebote', es: 'viviendas disponibles' },
  'home.all': { fr: 'Tous', ar: 'الكل', en: 'All', de: 'Alle', es: 'Todos' },
  'home.apartments': { fr: 'Appartements', ar: 'شقق', en: 'Apartments', de: 'Wohnungen', es: 'Apartamentos' },
  'home.apartment': { fr: 'Appartement', ar: 'شقة', en: 'Apartment', de: 'Wohnung', es: 'Apartamento' },
  'home.houses': { fr: 'Maisons', ar: 'منازل', en: 'Houses', de: 'Häuser', es: 'Casas' },
  'home.house': { fr: 'Maison', ar: 'منزل', en: 'House', de: 'Haus', es: 'Casa' },
  'home.studios': { fr: 'Studios', ar: 'ستوديو', en: 'Studios', de: 'Studios', es: 'Estudios' },
  'home.studio': { fr: 'Studio', ar: 'ستوديو', en: 'Studio', de: 'Studio', es: 'Estudio' },
  'home.offices': { fr: 'Bureaux', ar: 'مكاتب', en: 'Offices', de: 'Büros', es: 'Oficinas' },
  'home.office': { fr: 'Bureau', ar: 'مكتب', en: 'Office', de: 'Büro', es: 'Oficina' },
  'home.no_results': { fr: 'Aucun résultat trouvé', ar: 'لم يتم العثور على نتائج', en: 'No results found', de: 'Keine Ergebnisse gefunden', es: 'No se encontraron resultados' },
  'home.try_again': { fr: 'Essayez de modifier vos critères de recherche.', ar: 'حاول تغيير معايير البحث الخاصة بك.', en: 'Try modifying your search criteria.', de: 'Versuchen Sie, Ihre Suchkriterien zu ändern.', es: 'Intente modificar sus criterios de búsqueda.' },
  'home.filters': { fr: 'Filtres', ar: 'فلاتر', en: 'Filters', de: 'Filter', es: 'Filtros' },
  'home.more_filters': { fr: 'Plus de filtres', ar: 'المزيد من الفلاتر', en: 'More filters', de: 'Mehr Filter', es: 'Más filtros' },
  'home.property_type': { fr: 'Type de bien', ar: 'نوع العقار', en: 'Property Type', de: 'Immobilientyp', es: 'Tipo de propiedad' },
  'home.city': { fr: 'Ville', ar: 'المدينة', en: 'City', de: 'Stadt', es: 'Ciudad' },
  'home.price': { fr: 'Prix', ar: 'السعر', en: 'Price', de: 'Preis', es: 'Precio' },
  'home.min_price': { fr: 'Prix Min', ar: 'السعر الأدنى', en: 'Min Price', de: 'Min. Preis', es: 'Precio mín.' },
  'home.max_price': { fr: 'Prix Max', ar: 'السعر الأقصى', en: 'Max Price', de: 'Max. Preis', es: 'Precio máx.' },
  'home.min_area': { fr: 'Surface Min (m²)', ar: 'المساحة الدنيا (م²)', en: 'Min Area (sqm)', de: 'Min. Fläche (m²)', es: 'Superficie mín. (m²)' },
  'home.max_area': { fr: 'Surface Max (m²)', ar: 'المساحة القصوى (م²)', en: 'Max Area (sqm)', de: 'Max. Fläche (m²)', es: 'Superficie máx. (m²)' },
  'home.bedrooms': { fr: 'Chambres', ar: 'غرف النوم', en: 'Bedrooms', de: 'Schlafzimmer', es: 'Habitaciones' },
  'home.bathrooms': { fr: 'Salles de bain / Toilettes', ar: 'الحمامات / المراحيض', en: 'Bathrooms / Toilets', de: 'Badezimmer / WCs', es: 'Baños / Aseos' },
  'home.bedrooms_count': { fr: 'Nombre de chambres', ar: 'عدد الغرف', en: 'Number of bedrooms', de: 'Anzahl Schlafzimmer', es: 'Número de habitaciones' },
  'home.bathrooms_count': { fr: 'Nombre de sdb / toilettes', ar: 'عدد الحمامات / المراحيض', en: 'Bathrooms / Toilets', de: 'Anzahl Bäder / WCs', es: 'Número de baños / aseos' },
  'home.sort_by': { fr: 'Trier par', ar: 'ترتيب حسب', en: 'Sort by', de: 'Sortieren nach', es: 'Ordenar por' },
  'home.sort_recent': { fr: 'Plus récents', ar: 'الأحدث', en: 'Newest', de: 'Neueste zuerst', es: 'Más recientes' },
  'home.sort_price_asc': { fr: 'Prix : Croissant', ar: 'السعر: تصاعدي', en: 'Price: Low to High', de: 'Preis: Aufsteigend', es: 'Precio: Menor a mayor' },
  'home.sort_price_desc': { fr: 'Prix : Décroissant', ar: 'السعر: تنازلي', en: 'Price: High to Low', de: 'Preis: Absteigend', es: 'Precio: Mayor a menor' },
  'home.sort_area_desc': { fr: 'Surface : Décroissante', ar: 'المساحة: تنازلي', en: 'Area: Largest', de: 'Fläche: Absteigend', es: 'Superficie: Mayor a menor' },
  'home.for_sale_badge': { fr: 'Vente', ar: 'شراء (بيع)', en: 'Buy', de: 'Kauf', es: 'Venta' },
  'home.for_rent_badge': { fr: 'Location', ar: 'كراء (إيجار)', en: 'Rent', de: 'Miete', es: 'Alquiler' },
  'home.all_badge': { fr: 'Tous types', ar: 'الكل', en: 'All', de: 'Alle Typen', es: 'Todos los tipos' },
  'home.popular_cities': { fr: 'Villes', ar: 'المدن', en: 'Cities', de: 'Städte', es: 'Ciudades' },
  'home.filter_results': { fr: 'Voir les résultats', ar: 'عرض النتائج', en: 'View results', de: 'Ergebnisse anzeigen', es: 'Ver resultados' },
  'home.active_filters': { fr: 'Filtres actifs', ar: 'فلاتر نشطة', en: 'Active filters', de: 'Aktive Filter', es: 'Filtros activos' },
  'home.any': { fr: 'Tous', ar: 'الكل', en: 'All', de: 'Alle', es: 'Todos' },
  'home.reset': { fr: 'Réinitialiser', ar: 'إعادة تعيين', en: 'Reset', de: 'Zurücksetzen', es: 'Restablecer' },
  'home.apply': { fr: 'Appliquer', ar: 'تطبيق', en: 'Apply', de: 'Anwenden', es: 'Aplicar' },
  'home.view_more': { fr: 'Voir plus de propriétés', ar: 'شاهد المزيد من العقارات', en: 'View more properties', de: 'Weitere Immobilien anzeigen', es: 'Ver más propiedades' },
  'home.loading': { fr: 'Chargement...', ar: 'جاري التحميل...', en: 'Loading...', de: 'Laden...', es: 'Cargando...' },
  'home.showing_props': { fr: 'Affichage de propriétés', ar: 'عرض العقارات', en: 'Showing properties', de: 'Angezeigte Immobilien', es: 'Mostrando propiedades' },
  'home.clear_filters': { fr: 'Effacer tous les filtres', ar: 'مسح جميع الفلاتر', en: 'Clear all filters', de: 'Alle Filter löschen', es: 'Borrar todos los filtros' },
  
  // Listing Card
  'card.for_sale': { fr: 'À vendre', ar: 'للبيع', en: 'For Sale', de: 'Zu verkaufen', es: 'En venta' },
  'card.for_rent': { fr: 'À louer', ar: 'للكراء', en: 'For Rent', de: 'Zu vermieten', es: 'En alquiler' },
  'card.sold': { fr: 'Vendu', ar: 'تم البيع', en: 'Sold', de: 'Verkauft', es: 'Vendido' },
  'card.rented': { fr: 'Loué', ar: 'تم الكراء', en: 'Rented', de: 'Vermietet', es: 'Alquilado' },
  'card.month': { fr: '/mois', ar: '/شهر', en: '/month', de: '/Monat', es: '/mes' },
  'card.bedrooms': { fr: 'Ch.', ar: 'غرف', en: 'Bed.', de: 'Zi.', es: 'Hab.' },
  'card.bathrooms': { fr: 'Sdb.', ar: 'حمام', en: 'Bath.', de: 'Bad', es: 'Baño' },
  
  // Listing Details
  'details.back': { fr: 'Retour à l\'accueil', ar: 'العودة للرئيسية', en: 'Back to home', de: 'Zurück zur Startseite', es: 'Volver al inicio' },
  'details.not_found': { fr: 'Annonce introuvable', ar: 'الإعلان غير موجود', en: 'Listing not found', de: 'Immobilie nicht gefunden', es: 'Anuncio no encontrado' },
  'details.bedrooms': { fr: 'Chambres', ar: 'غرف النوم', en: 'Bedrooms', de: 'Schlafzimmer', es: 'Habitaciones' },
  'details.bathrooms': { fr: 'Salles de bain', ar: 'حمامات', en: 'Bathrooms', de: 'Badezimmer', es: 'Baños' },
  'details.area': { fr: 'Superficie', ar: 'المساحة', en: 'Area', de: 'Fläche', es: 'Superficie' },
  'details.description': { fr: 'Description', ar: 'الوصف', en: 'Description', de: 'Beschreibung', es: 'Descripción' },
  'details.amenities': { fr: 'Équipements', ar: 'التجهيزات', en: 'Amenities', de: 'Ausstattung', es: 'Comodidades' },
  'details.no_amenities': { fr: 'Aucun équipement spécifié', ar: 'لم يتم تحديد أي تجهيزات', en: 'No amenities specified', de: 'Keine Ausstattung angegeben', es: 'No se han especificado comodidades' },
  'details.virtual_tour': { fr: 'Visite & Vidéo', ar: 'جولة وفيديو', en: 'Tour & Video', de: 'Besichtigung & Video', es: 'Visita y Vídeo' },
  'details.3d_tour': { fr: 'Visite virtuelle 3D', ar: 'جولة افتراضية ثلاثية الأبعاد', en: '3D Virtual Tour', de: 'Virtuelle 3D-Besichtigung', es: 'Visita virtual 3D' },
  'details.price': { fr: 'Prix', ar: 'السعر', en: 'Price', de: 'Preis', es: 'Precio' },
  'details.contact_whatsapp': { fr: 'Contacter via WhatsApp', ar: 'اتصل عبر واتساب', en: 'Contact via WhatsApp', de: 'Per WhatsApp kontaktieren', es: 'Contactar por WhatsApp' },
  'details.book_appointment': { fr: 'Prendre rendez-vous', ar: 'حجز موعد', en: 'Book an appointment', de: 'Termin vereinbaren', es: 'Reservar una cita' },
  'details.agent_title': { fr: 'Conseiller immobilier', ar: 'مستشار عقاري', en: 'Real estate advisor', de: 'Immobilienberater', es: 'Asesor inmobiliario' },
  'details.all_photos': { fr: 'Toutes les photos', ar: 'جميع الصور', en: 'All photos', de: 'Alle Fotos', es: 'Todas las fotos' },
  'details.photo_count': { fr: 'Photos', ar: 'صور', en: 'Photos', de: 'Fotos', es: 'Fotos' },
  'details.fullscreen': { fr: 'Plein écran', ar: 'شاشة كاملة', en: 'Fullscreen', de: 'Vollbild', es: 'Pantalla completa' },
  'details.close': { fr: 'Fermer', ar: 'إغلاق', en: 'Close', de: 'Schließen', es: 'Cerrar' },
  
  // Footer
  'footer.services': { fr: 'Services', ar: 'خدماتنا', en: 'Services', de: 'Dienstleistungen', es: 'Servicios' },
  'footer.contact': { fr: 'Contact', ar: 'اتصل بنا', en: 'Contact', de: 'Kontakt', es: 'Contacto' },
  'footer.follow_us': { fr: 'Suivez-nous', ar: 'تابعنا', en: 'Follow us', de: 'Folgen Sie uns', es: 'Síganos' },
  'footer.rights': { fr: 'Tous droits réservés.', ar: 'جميع الحقوق محفوظة.', en: 'All rights reserved.', de: 'Alle Rechte vorbehalten.', es: 'Todos los derechos reservados.' },
  'footer.tagline': { fr: 'Votre partenaire de confiance pour trouver le logement de vos rêves. Une expérience moderne et simplifiée pour l\'immobilier.', ar: 'شريكك الموثوق للعثور على سكن أحلامك. تجربة حديثة ومبسطة للعقارات.', en: 'Your trusted partner to find the home of your dreams. A modern and simplified real estate experience.', de: 'Ihr vertrauenswürdiger Partner bei der Suche nach Ihrer Traumimmobilie. Ein modernes und einfaches Immobilienerlebnis.', es: 'Su socio de confianza para encontrar la vivienda de sus sueños. Una experiencia inmobiliaria moderna y simplificada.' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
