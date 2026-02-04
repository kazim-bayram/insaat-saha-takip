import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Search,
  Shield,
  User,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Send,
  AtSign
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserRole } from '../types';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { getAllUsers, updateUserRole, sendPasswordReset, userProfile: currentUser } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [sendingResetTo, setSendingResetTo] = useState<string | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await getAllUsers();
      // Sort by createdAt descending (newest first)
      fetchedUsers.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
        return bTime - aTime;
      });
      setUsers(fetchedUsers);
    } catch (err) {
      setToast({ type: 'error', message: 'Kullanıcılar yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.uid) {
      setToast({ type: 'error', message: 'Kendi rolünüzü değiştiremezsiniz' });
      return;
    }

    setUpdatingUserId(userId);
    setShowRoleDropdown(null);

    try {
      await updateUserRole(userId, newRole);
      // Update local state
      setUsers(prev => prev.map(user => 
        user.uid === userId ? { ...user, role: newRole } : user
      ));
      setToast({ type: 'success', message: `Kullanıcı rolü ${newRole === 'admin' ? 'Yönetici' : 'Çalışan'} olarak güncellendi` });
    } catch (err) {
      setToast({ type: 'error', message: 'Rol güncellenemedi' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSendPasswordReset = async (user: UserProfile) => {
    setSendingResetTo(user.uid);

    try {
      await sendPasswordReset(user.email);
      setToast({ type: 'success', message: `Şifre sıfırlama e-postası ${user.email} adresine gönderildi` });
    } catch (err) {
      setToast({ type: 'error', message: 'E-posta gönderilemedi' });
    } finally {
      setSendingResetTo(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    );
  });

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className={`rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border animate-slide-up ${
        isDark 
          ? 'bg-slate-850 border-slate-700/50' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-safety-orange/10 rounded-lg">
              <Users className="w-5 h-5 text-safety-orange" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Kullanıcı Yönetimi
              </h2>
              <p className={`text-sm ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                {users.length} kullanıcı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark 
                ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-3 animate-slide-up ${
            toast.type === 'success' 
              ? 'bg-green-500/10 border border-green-500/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <p className={`text-sm ${toast.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
              {toast.message}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="İsim, e-posta veya kullanıcı adı ile ara..."
              className={`w-full rounded-xl pl-12 pr-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                isDark 
                  ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                  : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
              }`}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-safety-orange animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className={`text-center py-12 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="px-4 pb-4">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left text-xs font-medium uppercase tracking-wider ${
                      isDark ? 'text-concrete-500' : 'text-gray-500'
                    }`}>
                      <th className="px-4 py-3">Kullanıcı</th>
                      <th className="px-4 py-3">Kullanıcı Adı</th>
                      <th className="px-4 py-3">Rol</th>
                      <th className="px-4 py-3">Kayıt Tarihi</th>
                      <th className="px-4 py-3">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filteredUsers.map((user) => (
                      <tr key={user.uid} className={`${
                        isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'
                      } transition-colors`}>
                        {/* User Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              user.role === 'admin' 
                                ? 'bg-safety-orange/20' 
                                : isDark ? 'bg-slate-700' : 'bg-gray-200'
                            }`}>
                              {user.role === 'admin' ? (
                                <Shield className="w-5 h-5 text-safety-orange" />
                              ) : (
                                <User className={`w-5 h-5 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`} />
                              )}
                            </div>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {user.displayName || 'İsimsiz'}
                                {user.uid === currentUser?.uid && (
                                  <span className={`ml-2 text-xs ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>(Siz)</span>
                                )}
                              </p>
                              <p className={`text-sm flex items-center gap-1 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                                <Mail className="w-3.5 h-3.5" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-concrete-300' : 'text-gray-600'}`}>
                            <AtSign className="w-3.5 h-3.5" />
                            {user.username || '-'}
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4">
                          <div className="relative">
                            <button
                              onClick={() => setShowRoleDropdown(showRoleDropdown === user.uid ? null : user.uid)}
                              disabled={updatingUserId === user.uid || user.uid === currentUser?.uid}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                user.role === 'admin'
                                  ? 'bg-safety-orange/20 text-safety-orange'
                                  : isDark
                                    ? 'bg-slate-700 text-concrete-300'
                                    : 'bg-gray-200 text-gray-700'
                              } ${user.uid !== currentUser?.uid ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                            >
                              {updatingUserId === user.uid ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  {user.role === 'admin' ? 'Yönetici' : 'Çalışan'}
                                  {user.uid !== currentUser?.uid && <ChevronDown className="w-3.5 h-3.5" />}
                                </>
                              )}
                            </button>

                            {/* Role Dropdown */}
                            {showRoleDropdown === user.uid && user.uid !== currentUser?.uid && (
                              <div className={`absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border z-50 min-w-[120px] ${
                                isDark 
                                  ? 'bg-slate-800 border-slate-600' 
                                  : 'bg-white border-gray-200'
                              }`}>
                                <button
                                  onClick={() => handleRoleChange(user.uid, 'worker')}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                    user.role === 'worker'
                                      ? isDark ? 'bg-slate-700' : 'bg-gray-100'
                                      : isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                                  } ${isDark ? 'text-white' : 'text-gray-700'}`}
                                >
                                  Çalışan
                                </button>
                                <button
                                  onClick={() => handleRoleChange(user.uid, 'admin')}
                                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                    user.role === 'admin'
                                      ? isDark ? 'bg-slate-700' : 'bg-gray-100'
                                      : isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                                  } ${isDark ? 'text-white' : 'text-gray-700'}`}
                                >
                                  Yönetici
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Created At */}
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => handleSendPasswordReset(user)}
                            disabled={sendingResetTo === user.uid}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              isDark
                                ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            } disabled:opacity-50`}
                          >
                            {sendingResetTo === user.uid ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Şifre Sıfırla
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredUsers.map((user) => (
                  <div 
                    key={user.uid}
                    className={`rounded-xl p-4 border ${
                      isDark 
                        ? 'bg-slate-800/50 border-slate-700/50' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          user.role === 'admin' 
                            ? 'bg-safety-orange/20' 
                            : isDark ? 'bg-slate-700' : 'bg-gray-200'
                        }`}>
                          {user.role === 'admin' ? (
                            <Shield className="w-5 h-5 text-safety-orange" />
                          ) : (
                            <User className={`w-5 h-5 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`} />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {user.displayName || 'İsimsiz'}
                            {user.uid === currentUser?.uid && (
                              <span className={`ml-2 text-xs ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>(Siz)</span>
                            )}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                            @{user.username || '-'}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin'
                          ? 'bg-safety-orange/20 text-safety-orange'
                          : isDark
                            ? 'bg-slate-700 text-concrete-300'
                            : 'bg-gray-200 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? 'Yönetici' : 'Çalışan'}
                      </span>
                    </div>

                    <div className={`text-xs space-y-1 mb-3 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                      <p className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(user.createdAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {user.uid !== currentUser?.uid && (
                        <button
                          onClick={() => handleRoleChange(user.uid, user.role === 'admin' ? 'worker' : 'admin')}
                          disabled={updatingUserId === user.uid}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                            isDark
                              ? 'bg-slate-700 text-concrete-300 hover:bg-slate-600'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:opacity-50`}
                        >
                          {updatingUserId === user.uid ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Shield className="w-3.5 h-3.5" />
                              {user.role === 'admin' ? 'Çalışan Yap' : 'Yönetici Yap'}
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleSendPasswordReset(user)}
                        disabled={sendingResetTo === user.uid}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          isDark
                            ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        } disabled:opacity-50`}
                      >
                        {sendingResetTo === user.uid ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            Şifre Sıfırla
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
