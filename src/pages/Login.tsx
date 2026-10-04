import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle, UserPlus, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email);
        setSuccess('Un e-mail de réinitialisation de mot de passe a été envoyé. Veuillez vérifier votre boîte de réception.');
      } else if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/admin');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/admin');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé. Veuillez vous connecter.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit faire au moins 6 caractères.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Aucun utilisateur trouvé avec cet email.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Mot de passe incorrect.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Email ou mot de passe incorrect.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-200">
            {isForgotPassword ? (
              <Mail className="text-white w-8 h-8" />
            ) : (
              <LogIn className="text-white w-8 h-8" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {isForgotPassword ? 'Mot de passe oublié' : 'Espace Professionnel'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isForgotPassword 
              ? 'Saisissez votre e-mail pour recevoir un lien de réinitialisation' 
              : 'Connectez-vous pour gérer vos annonces'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center text-green-700 text-sm">
            <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0 text-green-500" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="email" 
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-gray-700">Mot de passe</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors focus:outline-none"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required={!isForgotPassword}
                  className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Chargement...' : (isForgotPassword ? 'Envoyer le lien de réinitialisation' : 'Se connecter')}
          </button>
        </form>

        {isForgotPassword && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setIsLogin(true);
                setError('');
                setSuccess('');
              }}
              className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors focus:outline-none animate-fade-in"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
