import React, { useState } from 'react';
import { HardHat, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!displayName.trim()) {
          throw new Error('Please enter your name');
        }
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      // Make Firebase errors more user-friendly
      if (message.includes('auth/invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (message.includes('auth/email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (message.includes('auth/weak-password')) {
        setError('Password should be at least 6 characters long.');
      } else if (message.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-steel-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 safety-tape opacity-60" />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-safety-orange/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-steel-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-safety-orange to-safety-orange-dark rounded-2xl shadow-industrial-lg mb-4">
            <HardHat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SiteNotes</h1>
          <p className="text-concrete-400">Construction Field Note App</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-850/80 backdrop-blur-sm rounded-2xl shadow-industrial-lg border border-slate-700/50 p-8">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-slide-up">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field (Register Only) */}
            {isRegister && (
              <div className="animate-slide-up">
                <label className="block text-concrete-300 text-sm font-medium mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-concrete-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-concrete-500 focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                    required={isRegister}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-concrete-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-concrete-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-concrete-500 focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-concrete-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-concrete-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-xl pl-12 pr-12 py-4 text-white placeholder-concrete-500 focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-concrete-500 hover:text-concrete-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-safety-orange to-safety-orange-dark hover:from-safety-orange-dark hover:to-safety-orange text-white font-semibold py-4 px-6 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 btn-industrial"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="mt-6 text-center">
            <p className="text-concrete-400 text-sm">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="ml-2 text-safety-orange hover:text-safety-orange-light font-medium transition-colors"
              >
                {isRegister ? 'Sign In' : 'Create Account'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-concrete-500 text-sm mt-6">
          Secure site documentation for your engineering team
        </p>
      </div>
    </div>
  );
};

export default Login;
