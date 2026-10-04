import { Link, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Home, User as UserIcon, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../SettingsContext';
import { useLanguage, Language } from '../LanguageContext';
import { Globe } from 'lucide-react';

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              {settings.appLogo ? (
                <img src={settings.appLogo} alt={settings.appName} className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: settings.primaryColor }}
                >
                  <Home className="text-white w-5 h-5" />
                </div>
              )}
              <span className="text-xl font-bold tracking-tight text-gray-900">{settings.appName}</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    language === lang.code
                      ? 'bg-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={language === lang.code ? { color: settings.primaryColor } : {}}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>

            <Link to="/" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">{t('nav.listings')}</Link>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/admin" className="text-gray-600 hover:text-orange-600 font-medium transition-colors">{t('nav.dashboard')}</Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 font-medium transition-colors">
                <UserIcon className="w-4 h-4" />
                <span>{t('nav.pro_space')}</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <div className="flex items-center bg-gray-50 rounded-full p-1 border border-gray-100">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    language === lang.code
                      ? 'bg-white shadow-sm'
                      : 'text-gray-400'
                  }`}
                  style={language === lang.code ? { color: settings.primaryColor } : {}}
                >
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-4 px-4 space-y-4">
          <Link to="/" className="block text-gray-600 hover:text-orange-600 font-medium" onClick={() => setIsOpen(false)}>{t('nav.listings')}</Link>
          {user ? (
            <>
              <Link to="/admin" className="block text-gray-600 hover:text-orange-600 font-medium" onClick={() => setIsOpen(false)}>{t('nav.dashboard')}</Link>
              <button 
                onClick={() => { handleLogout(); setIsOpen(false); }}
                className="flex items-center space-x-2 text-gray-600 hover:text-red-600 font-medium w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 font-medium" onClick={() => setIsOpen(false)}>
              <UserIcon className="w-4 h-4" />
              <span>{t('nav.pro_space')}</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
