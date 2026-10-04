import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { UserPlus, UserCheck, UserX, Loader2, Search, Mail, Lock } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (user: UserProfile) => {
    if (user.email === 'admin@chahin-immobilier.com' || user.email === 'admin@manda.com' || user.email === 'hussamessmahi2@gmail.com') {
      alert("Impossible de modifier le statut d'un compte maître.");
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isActive: !user.isActive
      });
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setError('');

    try {
      // Create a secondary app to create user without logging out the current admin
      const secondaryApp = initializeApp(firebaseConfig, `user-creation-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUser = userCredential.user;

      // Create the profile in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: newEmail,
        role: 'admin',
        isActive: true
      });

      // Cleanup
      await deleteApp(secondaryApp);
      
      setNewEmail('');
      setNewPassword('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error adding user:', err);
      setError(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setAddLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200"
        >
          <UserPlus className="w-5 h-5" />
          <span>Ajouter un compte</span>
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Nouvel Utilisateur</h3>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="password" 
                required
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button 
                type="submit"
                disabled={addLoading}
                className="flex items-center space-x-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50"
              >
                {addLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Créer le compte</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Rôle</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                        {u.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-gray-900">{u.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-500 uppercase">{u.role}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => toggleStatus(u)}
                      className={`p-2 rounded-lg transition-all ${u.isActive ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}
                      title={u.isActive ? 'Désactiver' : 'Activer'}
                    >
                      {u.isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
