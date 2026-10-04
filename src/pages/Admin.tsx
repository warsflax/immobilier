import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, addDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Listing, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Plus, Edit2, Trash2, List, Settings, Search, X, Check, Building2, Globe, Users, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ListingForm from '../components/ListingForm';
import AdminSettings from '../components/AdminSettings';
import UserManagement from '../components/UserManagement';
import { useUser } from '../UserContext';
import { useSettings } from '../SettingsContext';
import { getDocs } from 'firebase/firestore';

export default function Admin() {
  const { profile, user, isSuperAdmin } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'listings' | 'settings' | 'users'>('listings');
  const [exporting, setExporting] = useState(false);

  const { settings } = useSettings();

  useEffect(() => {
    if (!profile) {
      if (loading) setLoading(false);
      return;
    }

    const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
      setListings(data);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching listings:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'listings', id));
      setConfirmDeleteId(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      alert('Erreur lors de la suppression : ' + (error.message || 'Erreur inconnue'));
      handleFirestoreError(error, OperationType.DELETE, `listings/${id}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredListings = listings.filter(l => 
    l.title.toLowerCase().includes(search.toLowerCase()) || 
    l.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportData = async () => {
    setExporting(true);
    try {
      const listingsSnap = await getDocs(collection(db, 'listings'));
      const settingsSnap = await getDocs(collection(db, 'settings'));
      const usersSnap = await getDocs(collection(db, 'users'));

      const data = {
        listings: listingsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        settings: settingsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        users: usersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chahin_immobilier_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Erreur lors de l\'exportation des données.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!profile || !profile.isActive) {
    const isMasterAdmin = user?.email === 'hussamessmahi2@gmail.com' || user?.email === 'admin@chahin-immobilier.com' || user?.email === 'admin@manda.com';
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <p className="text-gray-500 mb-6">
            {!profile?.isActive 
              ? "Votre compte est actuellement désactivé. Veuillez contacter l'administrateur principal."
              : isMasterAdmin 
                ? "Une erreur est survenue lors de la récupération de votre profil administrateur."
                : "Profil introuvable. Veuillez vous reconnecter."}
          </p>
          
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => auth.signOut()}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-300 transition-all"
            >
              Se déconnecter
            </button>
            
            {isMasterAdmin && (
              <button 
                onClick={() => window.location.reload()}
                className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all"
              >
                Réessayer la connexion
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden lg:block">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-10">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <span className="text-white font-bold">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Admin</span>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('listings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'listings' ? 'bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}
              style={activeTab === 'listings' ? { color: settings.primaryColor } : {}}
            >
              <List className="w-5 h-5" />
              <span>Annonces</span>
            </button>
            
            {isSuperAdmin && (
              <button 
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'users' ? 'bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}
                style={activeTab === 'users' ? { color: settings.primaryColor } : {}}
              >
                <Users className="w-5 h-5" />
                <span>Utilisateurs</span>
              </button>
            )}
            
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'settings' ? 'bg-orange-50' : 'text-gray-500 hover:bg-gray-50'}`}
              style={activeTab === 'settings' ? { color: settings.primaryColor } : {}}
            >
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </button>

            {isSuperAdmin && (
              <div className="pt-10">
                <button 
                  onClick={handleExportData}
                  disabled={exporting}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-4 rounded-2xl bg-gray-900 text-white font-bold hover:bg-black transition-all shadow-lg shadow-gray-200 disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  <span>Exporter JSON</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'listings' && (
            <>
              <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestion des annonces</h1>
                  <p className="text-gray-500 mt-1">Gérez vos offres immobilières en temps réel.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => { setEditingListing(null); setShowForm(true); }}
                    className="flex items-center space-x-2 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-orange-200"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <Plus className="w-5 h-5" />
                    <span>Nouvelle annonce</span>
                  </button>
                </div>
              </header>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">Total Annonces</p>
                  <p className="text-3xl font-black text-gray-900">{listings.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">À Vendre</p>
                  <p className="text-3xl font-black" style={{ color: settings.primaryColor }}>{listings.filter(l => l.type === 'sale').length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-2">À Louer</p>
                  <p className="text-3xl font-black text-blue-600">{listings.filter(l => l.type === 'rent').length}</p>
                </div>
              </div>

              {/* Search & Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center">
                  <Search className="text-gray-400 w-5 h-5 mr-3" />
                  <input 
                    type="text" 
                    placeholder="Rechercher une annonce..." 
                    className="w-full focus:outline-none text-gray-700"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest">
                        <th className="px-6 py-4">Logement</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Prix</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Créé par</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredListings.map(listing => (
                        <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <img 
                                src={listing.images[0]} 
                                alt="" 
                                className="w-12 h-12 rounded-xl object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-bold text-gray-900">{listing.title}</p>
                                <p className="text-xs text-gray-500">{listing.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {listing.status === 'available' && (
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${listing.type === 'sale' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                {listing.type === 'sale' ? 'Vente' : 'Location'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-900">
                            {listing.price.toLocaleString()} {settings.currency}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center text-xs font-bold ${listing.status === 'available' ? 'text-green-600' : 'text-gray-400'}`}>
                              {listing.status === 'available' ? (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Disponible
                                </>
                              ) : (
                                <span>{listing.status === 'sold' ? 'Vendu' : 'Loué'}</span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs">
                              <p className="text-gray-900 font-semibold">{listing.createdByEmail || 'Admin'}</p>
                              <p className="text-gray-400">{new Date(listing.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => { setEditingListing(listing); setShowForm(true); }}
                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(listing.id)}
                                disabled={deletingId === listing.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              >
                                {deletingId === listing.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredListings.length === 0 && (
                    <div className="p-20 text-center text-gray-500">
                      Aucune annonce trouvée.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paramètres généraux</h1>
                <p className="text-gray-500 mt-1">Personnalisez l'apparence et les informations de votre plateforme.</p>
              </header>
              <AdminSettings />
            </>
          )}

          {activeTab === 'users' && isSuperAdmin && (
            <>
              <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestion des utilisateurs</h1>
                <p className="text-gray-500 mt-1">Gérez les comptes accédant à l'interface d'administration.</p>
              </header>
              <UserManagement />
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmer la suppression</h3>
              <p className="text-gray-500 mb-8">Cette action est irréversible. Voulez-vous vraiment supprimer cette annonce ?</p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleDelete(confirmDeleteId)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingListing ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-8">
                <ListingForm 
                  listing={editingListing} 
                  onSuccess={() => setShowForm(false)} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
