import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  AtSign,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { firebaseConfig } from '../firebase/config';
import { db } from '../firebase/config';
import { UserRole } from '../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { isDark } = useTheme();
  const { checkUsernameAvailable } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('worker');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setUsername('');
    setDisplayName('');
    setRole('worker');
    setShowPassword(false);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate inputs
      if (!email || !password || !username || !displayName) {
        throw new Error('Lütfen tüm alanları doldurun');
      }

      if (password.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalıdır');
      }

      // Check username availability
      const isUsernameAvailable = await checkUsernameAvailable(username);
      if (!isUsernameAvailable) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor');
      }

      // Create a secondary Firebase app instance
      const secondaryAppName = 'SecondaryApp';
      
      // Check if secondary app already exists and delete it
      const existingApps = getApps();
      const existingSecondary = existingApps.find(app => app.name === secondaryAppName);
      if (existingSecondary) {
        await deleteApp(existingSecondary);
      }

      // Initialize secondary app
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);

      // Create user with secondary auth (doesn't affect admin session)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );

      // Create user profile in Firestore using MAIN db instance
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        username: username.toLowerCase(),
        displayName: displayName,
        role: role,
        createdAt: serverTimestamp()
      });

      // Sign out from secondary auth and clean up
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setSuccess(true);
      
      // Wait a moment to show success message
      setTimeout(() => {
        handleClose();
        onUserCreated();
      }, 1500);

    } catch (err: any) {
      console.error('Error creating user:', err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanılıyor');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz e-posta adresi');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf. En az 6 karakter kullanın');
      } else {
        setError(err.message || 'Kullanıcı oluşturulurken bir hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className={`rounded-2xl max-w-md w-full shadow-2xl border animate-slide-up ${
        isDark 
          ? 'bg-slate-850 border-slate-700/50' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Yeni Kullanıcı Ekle
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl flex items-center gap-3 bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-xl flex items-center gap-3 bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-300 text-sm">Kullanıcı başarıyla oluşturuldu!</p>
            </div>
          )}

          {/* Display Name */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
              Ad Soyad *
            </label>
            <div className="relative">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className={`w-full rounded-xl pl-12 pr-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                  isDark 
                    ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                }`}
                required
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
              Kullanıcı Adı *
            </label>
            <div className="relative">
              <AtSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="ahmet_yilmaz"
                className={`w-full rounded-xl pl-12 pr-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                  isDark 
                    ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                }`}
                required
                minLength={3}
                disabled={loading || success}
              />
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
              Sadece harf, rakam ve alt çizgi (_) kullanabilirsiniz
            </p>
          </div>

          {/* Email */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
              E-posta *
            </label>
            <div className="relative">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@sirket.com"
                className={`w-full rounded-xl pl-12 pr-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                  isDark 
                    ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                }`}
                required
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
              Şifre *
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl pl-12 pr-12 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                  isDark 
                    ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                }`}
                required
                minLength={6}
                disabled={loading || success}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}
                disabled={loading || success}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
              En az 6 karakter
            </p>
          </div>

          {/* Role */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
              Rol *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRole('worker')}
                disabled={loading || success}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  role === 'worker'
                    ? 'bg-blue-600/20 border-2 border-blue-500 text-blue-400'
                    : isDark
                      ? 'bg-slate-800 border-2 border-slate-600 text-concrete-400 hover:border-slate-500'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <User className="w-5 h-5" />
                Çalışan
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                disabled={loading || success}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                  role === 'admin'
                    ? 'bg-safety-orange/20 border-2 border-safety-orange text-safety-orange'
                    : isDark
                      ? 'bg-slate-800 border-2 border-slate-600 text-concrete-400 hover:border-slate-500'
                      : 'bg-gray-100 border-2 border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Shield className="w-5 h-5" />
                Yönetici
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex items-center justify-center gap-2 bg-safety-orange hover:bg-safety-orange-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Kullanıcı Oluşturuluyor...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Başarılı!
              </>
            ) : (
              'Kullanıcı Oluştur'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
