import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';
import { useSettings } from '../SettingsContext';
import { useLanguage } from '../LanguageContext';

export default function Footer() {
  const { settings } = useSettings();
  const { t, isRTL } = useLanguage();

  return (
    <footer className={`bg-gray-900 text-white pt-16 pb-8 ${isRTL ? 'font-arabic' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              {settings.appLogo ? (
                <img src={settings.appLogo} alt={settings.appName} className="h-8 w-auto object-contain brightness-0 invert" referrerPolicy="no-referrer" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <span className="text-white font-bold">{settings.appName.charAt(0)}</span>
                </div>
              )}
              <span className="text-xl font-bold tracking-tight">{settings.appName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">{t('footer.services')}</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-[var(--hover-color)] transition-colors" style={{ '--hover-color': settings.primaryColor } as any}>{t('home.rent')}</a></li>
              <li><a href="#" className="hover:text-[var(--hover-color)] transition-colors" style={{ '--hover-color': settings.primaryColor } as any}>{t('home.sale')}</a></li>
              <li><a href="#" className="hover:text-[var(--hover-color)] transition-colors" style={{ '--hover-color': settings.primaryColor } as any}>Gestion locative</a></li>
              <li><a href="#" className="hover:text-[var(--hover-color)] transition-colors" style={{ '--hover-color': settings.primaryColor } as any}>Estimation</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">{t('footer.contact')}</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4" style={{ color: settings.primaryColor }} />
                <span>{settings.contactPhone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4" style={{ color: settings.primaryColor }} />
                <span>{settings.contactEmail}</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="w-4 h-4" style={{ color: settings.primaryColor }} />
                <span>{settings.address}</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-6">{t('footer.follow_us')}</h3>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[var(--hover-color)] transition-colors" style={{ '--hover-color': settings.primaryColor } as any}>
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[var(--hover-color)] transition-colors" style={{ '--hover-color': settings.primaryColor } as any}>
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[var(--hover-color)] transition-colors" style={{ '--hover-color': settings.primaryColor } as any}>
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-xs">
          <p>&copy; {new Date().getFullYear()} {settings.appName}. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
