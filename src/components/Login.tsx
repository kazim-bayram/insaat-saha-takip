import React, { useState } from 'react';
import { HardHat, Lock, User, AlertCircle, Loader2, Eye, EyeOff, Sun, Moon, AtSign, CheckCircle2, XCircle } from 'lucide-react';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { auth } from '../firebase/config';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const { login, register, checkUsernameAvailable } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  // Debounced username check
  const handleUsernameChange = async (value: string) => {
    setUsername(value);
    
    if (!value.trim() || value.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    
    try {
      const isAvailable = await checkUsernameAvailable(value);
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Registration validation
        if (!displayName.trim()) {
          throw new Error('Lütfen adınızı ve soyadınızı girin');
        }
        if (!username.trim() || username.length < 3) {
          throw new Error('Kullanıcı adı en az 3 karakter olmalıdır');
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          throw new Error('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
        }
        if (usernameStatus === 'taken') {
          throw new Error('Bu kullanıcı adı zaten alınmış');
        }
        if (password.length < 6) {
          throw new Error('Şifre en az 6 karakter olmalıdır');
        }
        if (password !== confirmPassword) {
          throw new Error('Şifreler eşleşmiyor');
        }
        
        try {
          await register(username, password, displayName);
        } catch (registerErr: any) {
          // Check if it's a Firestore permission error
          if (registerErr.message?.includes('permission') || 
              registerErr.message?.includes('PERMISSION_DENIED') ||
              registerErr.code === 'permission-denied') {
            throw new Error(
              'Hesap oluşturuldu ancak profil kaydedilemedi. Lütfen yönetici ile iletişime geçin.'
            );
          }
          throw registerErr;
        }
      } else {
        // Login with Remember Me persistence
        try {
          // Set persistence based on "Remember Me" checkbox
          if (rememberMe) {
            await setPersistence(auth, browserLocalPersistence);
          } else {
            await setPersistence(auth, browserSessionPersistence);
          }
          
          // Username-only login (appends @insaat.local)
          await login(username, password);
        } catch (loginErr: any) {
          throw loginErr;
        }
      }
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Kimlik doğrulama başarısız';
      
      // Map Firebase errors to user-friendly Turkish messages
      if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
        setError('Kullanıcı adı veya şifre hatalı');
      } else if (message.includes('auth/user-not-found')) {
        setError('Kullanıcı bulunamadı');
      } else if (message.includes('auth/email-already-in-use')) {
        setError('Bu kullanıcı adı zaten alınmış');
      } else if (message.includes('auth/weak-password')) {
        setError('Şifre en az 6 karakter olmalıdır');
      } else if (message.includes('auth/invalid-email')) {
        setError('Kullanıcı adı geçersiz');
      } else if (message.includes('auth/too-many-requests')) {
        setError('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin');
      } else if (message.includes('Hesap erişime kapatılmıştır')) {
        setError('Hesabınız erişime kapatılmıştır. Lütfen yönetici ile iletişime geçin');
      } else if (message.includes('Şifreler eşleşmiyor')) {
        setError('Şifreler eşleşmiyor');
      } else if (message.includes('zaten alınmış')) {
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-steel-900' 
        : 'bg-gradient-to-br from-gray-100 via-gray-50 to-steel-50'
    }`}>
      {/* Arka Plan Deseni */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 safety-tape opacity-60" />
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl ${
          isDark ? 'bg-safety-orange/10' : 'bg-safety-orange/20'
        }`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl ${
          isDark ? 'bg-steel-600/10' : 'bg-steel-300/30'
        }`} />
      </div>

      {/* Tema Değiştirici */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-3 rounded-xl transition-colors ${
          isDark 
            ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
            : 'bg-white text-gray-700 hover:bg-gray-100 shadow-md'
        }`}
        title={isDark ? 'Açık Tema' : 'Koyu Tema'}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo & Başlık */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-safety-orange to-safety-orange-dark rounded-2xl shadow-industrial-lg mb-4">
            <HardHat className="w-10 h-10 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            SahaNot
          </h1>
          <p className={isDark ? 'text-concrete-400' : 'text-gray-500'}>
            Şantiye Saha Takip Uygulaması
          </p>
        </div>

        {/* Giriş Kartı */}
        <div className={`rounded-2xl shadow-industrial-lg border p-8 ${
          isDark 
            ? 'bg-slate-850/80 backdrop-blur-sm border-slate-700/50' 
            : 'bg-white/90 backdrop-blur-sm border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isRegister ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
          </h2>

          {/* Hata Mesajı */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Ad Soyad Alanı (Sadece Kayıt) */}
            {isRegister && (
              <div className="animate-slide-up">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                  Ad Soyad
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ahmet Yılmaz"
                    className={`w-full rounded-xl pl-12 pr-4 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                    }`}
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            {/* Kullanıcı Adı (Sadece Kayıt) */}
            {isRegister && (
              <div className="animate-slide-up">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <AtSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value.toLowerCase())}
                    placeholder="ahmet_yilmaz"
                    className={`w-full rounded-xl pl-12 pr-12 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                    } ${usernameStatus === 'taken' ? 'border-red-500' : ''} ${usernameStatus === 'available' ? 'border-green-500' : ''}`}
                    required={isRegister}
                    minLength={3}
                  />
                  {/* Username status indicator */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {usernameStatus === 'taken' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                {usernameStatus === 'taken' && (
                  <p className="text-red-400 text-xs mt-1">Bu kullanıcı adı zaten kullanılıyor</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="text-green-400 text-xs mt-1">Kullanıcı adı müsait</p>
                )}
                <p className={`text-xs mt-1 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
                  Sadece harf, rakam ve alt çizgi (_) kullanabilirsiniz
                </p>
              </div>
            )}

            {/* Kullanıcı Adı (Giriş ve Kayıt) */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                Kullanıcı Adı
              </label>
              <div className="relative">
                <AtSign className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => isRegister ? handleUsernameChange(e.target.value.toLowerCase()) : setUsername(e.target.value.toLowerCase())}
                  placeholder={isRegister ? "ahmet_yilmaz" : "Kullanıcı adınızı girin"}
                  className={`w-full rounded-xl pl-12 pr-4 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                    isDark 
                      ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                  } ${isRegister && usernameStatus === 'taken' ? 'border-red-500' : ''} ${isRegister && usernameStatus === 'available' ? 'border-green-500' : ''}`}
                  required
                  minLength={3}
                />
                {/* Username status indicator (only in register mode) */}
                {isRegister && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {usernameStatus === 'available' && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                    {usernameStatus === 'taken' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {isRegister && usernameStatus === 'taken' && (
                <p className="text-red-400 text-xs mt-1">Bu kullanıcı adı zaten kullanılıyor</p>
              )}
              {isRegister && usernameStatus === 'available' && (
                <p className="text-green-400 text-xs mt-1">Kullanıcı adı müsait</p>
              )}
              {isRegister && (
                <p className={`text-xs mt-1 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
                  Sadece harf, rakam ve alt çizgi (_) kullanabilirsiniz
                </p>
              )}
            </div>

            {/* Şifre Alanı */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                Şifre
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl pl-12 pr-12 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                    isDark 
                      ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                    isDark ? 'text-concrete-500 hover:text-concrete-300' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {isRegister && (
                <p className={`text-xs mt-1 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
                  En az 6 karakter
                </p>
              )}
            </div>

            {/* Şifre Tekrar Alanı (Sadece Kayıt) */}
            {isRegister && (
              <div className="animate-slide-up">
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full rounded-xl pl-12 pr-12 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                    } ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${
                      isDark ? 'text-concrete-500 hover:text-concrete-300' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password && confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Şifreler eşleşmiyor</p>
                )}
              </div>
            )}

            {/* Beni Hatırla (Sadece Giriş) */}
            {!isRegister && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`w-4 h-4 rounded border transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-slate-900/50 border-slate-600 text-safety-orange focus:ring-safety-orange/20 focus:ring-offset-slate-850'
                      : 'bg-white border-gray-300 text-safety-orange focus:ring-safety-orange/20 focus:ring-offset-white'
                  }`}
                />
                <label
                  htmlFor="rememberMe"
                  className={`ml-2 text-sm cursor-pointer select-none ${
                    isDark ? 'text-concrete-300' : 'text-gray-700'
                  }`}
                >
                  Beni Hatırla
                </label>
              </div>
            )}

            {/* Gönder Butonu */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-safety-orange to-safety-orange-dark hover:from-safety-orange-dark hover:to-safety-orange text-white font-semibold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 btn-industrial"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegister ? 'Hesap Oluşturuluyor...' : 'Giriş Yapılıyor...'}
                </>
              ) : (
                isRegister ? 'Hesap Oluştur' : 'Giriş Yap'
              )}
            </button>
          </form>

          {/* Kayıt/Giriş Geçişi */}
          <div className="mt-6 text-center">
            <p className={`text-sm ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
              {isRegister ? 'Zaten hesabınız var mı?' : 'Hesabınız yok mu?'}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  // Reset fields when switching
                  setUsername('');
                  setPassword('');
                  setConfirmPassword('');
                  setDisplayName('');
                  setUsernameStatus('idle');
                  setRememberMe(false);
                }}
                className="ml-2 text-safety-orange hover:text-safety-orange-light font-medium transition-colors"
              >
                {isRegister ? 'Giriş Yap' : 'Hesap Oluştur'}
              </button>
            </p>
          </div>
        </div>

        {/* Alt Yazı */}
        <p className={`text-center text-sm mt-6 ${isDark ? 'text-concrete-500' : 'text-gray-500'}`}>
          Saha Belgeleme Sitesi.
      </div>
    </div>
  );
};

export default Login;
