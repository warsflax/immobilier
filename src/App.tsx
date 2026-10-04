import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ListingDetails from './pages/ListingDetails';
import Admin from './pages/Admin';
import Login from './pages/Login';

import { SettingsProvider } from './SettingsContext';
import { LanguageProvider } from './LanguageContext';
import { UserProvider, useUser } from './UserContext';

function AppContent() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar user={user} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route path="/login" element={user ? <Navigate to="/admin" /> : <Login />} />
            <Route 
              path="/admin" 
              element={user ? <Admin /> : <Navigate to="/login" />} 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <LanguageProvider>
        <UserProvider>
          <AppContent />
        </UserProvider>
      </LanguageProvider>
    </SettingsProvider>
  );
}
