import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Filter,
  X,
  Calendar,
  FolderOpen,
  User,
  LayoutGrid,
  List,
  HardHat,
  FileText,
  ChevronDown,
  Sun,
  Moon,
  Download,
  Clock,
  CheckCircle2,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotes } from '../hooks/useNotes';
import { useNotifications } from '../hooks/useNotifications';
import { Note, FilterOptions, NOTE_STATUS_CONFIG, NoteFormData, getNoteImages } from '../types';
import NoteCard from './NoteCard';
import NoteDetailModal from './NoteDetailModal';
import AddNoteModal from './AddNoteModal';
import NotificationDropdown from './NotificationDropdown';
import ProfileSettings from './ProfileSettings';
import UserManagement from './UserManagement';
import UserProfileMenu from './UserProfileMenu';
import LoadingSpinner, { NotesGridSkeleton } from './LoadingSpinner';

const Dashboard: React.FC = () => {
  const { userProfile, logout, isAdmin, currentUser } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    notes,
    loading,
    error,
    uploading,
    uploadProgress,
    createNote,
    updateNote,
    deleteNote,
    updateNoteStatus,
    addComment,
    deleteComment,
    canEditNote,
    canDeleteNote,
    filterNotes,
    getProjectNames,
    getWorkerEmails,
    getKPIStats
  } = useNotes();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification
  } = useNotifications();

  // Modal durumları
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Görünüm durumu
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filtre durumu
  const [filters, setFilters] = useState<FilterOptions>({
    workerEmail: '',
    projectName: '',
    dateFrom: '',
    dateTo: ''
  });

  // Filtreleri uygula
  const filteredNotes = useMemo(() => {
    if (!isAdmin) return notes;
    return filterNotes(filters);
  }, [notes, filters, filterNotes, isAdmin]);

  // Filtre dropdown'ları için benzersiz değerler
  const projectNames = useMemo(() => getProjectNames(), [getProjectNames]);
  const workerEmails = useMemo(() => getWorkerEmails(), [getWorkerEmails]);

  // KPI statistics
  const kpiStats = useMemo(() => getKPIStats(), [getKPIStats]);

  // Export to CSV function
  const exportToCSV = useCallback(() => {
    // UTF-8 BOM for Turkish character support
    const BOM = '\uFEFF';
    
    // CSV Headers
    const headers = [
      'Tarih',
      'Proje Adı',
      'Ada',
      'Parsel',
      'Çalışan Email',
      'Açıklama',
      'Durum',
      'Resim URLleri'
    ];

    // Map status to Turkish labels
    const getStatusLabel = (status: string) => {
      return NOTE_STATUS_CONFIG[status as keyof typeof NOTE_STATUS_CONFIG]?.label || 'Beklemede';
    };

    // Convert notes to CSV rows
    const rows = filteredNotes.map(note => {
      const date = note.createdAt.toDate().toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Escape special characters and wrap in quotes
      const escapeCSV = (value: string) => {
        if (!value) return '';
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
      };

      // Get all image URLs with backward compatibility
      const imageUrls = getNoteImages(note).join(' | ');

      return [
        escapeCSV(date),
        escapeCSV(note.projectName || ''),
        escapeCSV(note.ada || ''),
        escapeCSV(note.parsel || ''),
        escapeCSV(note.userEmail || ''),
        escapeCSV(note.content || ''),
        escapeCSV(getStatusLabel(note.status || 'open')),
        escapeCSV(imageUrls)
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = BOM + headers.join(',') + '\n' + rows.join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `saha-notlari-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredNotes]);

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setShowDetailModal(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowAddModal(true);
  };

  const handleDeleteNote = async (note: Note) => {
    try {
      await deleteNote(note);
    } catch (err) {
      console.error('Not silinirken hata:', err);
    }
  };

  const handleSubmitNote = async (formData: NoteFormData, existingImageUrls?: string[]) => {
    if (editingNote) {
      await updateNote(
        editingNote.id, 
        formData, 
        formData.images.length > 0 ? formData.images : undefined,
        existingImageUrls
      );
      
      // If admin is editing someone else's note, create notification
      if (isAdmin && currentUser && editingNote.userId !== currentUser.uid && userProfile) {
        await createNotification(
          editingNote.userId,
          currentUser.uid,
          userProfile.displayName,
          editingNote.id,
          editingNote.title,
          `${userProfile.displayName} raporunuzu düzenledi`,
          'edit'
        );
      }
    } else {
      await createNote(formData);
    }
    setEditingNote(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
  };

  // Handle adding comment with notification
  const handleAddComment = async (noteId: string, text: string) => {
    const comment = await addComment(noteId, text);
    
    // Find the note to get owner info
    const note = notes.find(n => n.id === noteId);
    if (note && currentUser && userProfile) {
      // If admin comments on worker's note, notify the worker
      if (isAdmin && note.userId !== currentUser.uid) {
        await createNotification(
          note.userId,
          currentUser.uid,
          userProfile.displayName,
          noteId,
          note.title,
          `${userProfile.displayName} notunuza yorum ekledi: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          'comment'
        );
      }
      // If worker replies, notify the admin (notify all admins or the last commenter who was admin)
      // For simplicity, we'll just handle admin -> worker notifications
    }
    
    return comment;
  };

  // Handle notification click - navigate to the relevant note
  const handleNotificationClick = (notification: any) => {
    const note = notes.find(n => n.id === notification.noteId);
    if (note) {
      setSelectedNote(note);
      setShowDetailModal(true);
    }
  };

  const clearFilters = () => {
    setFilters({
      workerEmail: '',
      projectName: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = filters.workerEmail || filters.projectName || filters.dateFrom || filters.dateTo;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Çıkış yapılamadı:', err);
    }
  };

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Üst Menü */}
      <header className={`sticky top-0 z-40 border-b transition-colors ${
        isDark 
          ? 'bg-slate-850 border-slate-700/50' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Başlık */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-safety-orange to-safety-orange-dark rounded-xl flex items-center justify-center">
                <HardHat className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>SahaNot</h1>
                <p className={`text-xs ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                  {isAdmin ? 'Yönetici Paneli' : 'Saha Notları'}
                </p>
              </div>
            </div>

            {/* Kullanıcı Bilgisi & Aksiyonlar */}
            <div className="flex items-center gap-3">
              {/* Bildirimler */}
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onNotificationClick={handleNotificationClick}
              />

              {/* Tema Değiştirici */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-yellow-400 hover:bg-slate-700/50' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={isDark ? 'Açık Tema' : 'Koyu Tema'}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Profile Menu */}
              <UserProfileMenu
                onOpenProfileSettings={() => setShowProfileSettings(true)}
                onOpenUserManagement={() => setShowUserManagement(true)}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* KPI Özet Kartları (Sadece Yönetici) */}
        {isAdmin && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Toplam Not */}
            <div className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-slate-850 border-slate-700/50' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                  <BarChart3 className={`w-5 h-5 ${isDark ? 'text-concrete-300' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                    Toplam Not
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {kpiStats.totalNotes}
                  </p>
                </div>
              </div>
            </div>

            {/* Bekleyen Sorunlar */}
            <div className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-slate-850 border-slate-700/50' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-yellow-600/20' : 'bg-yellow-100'}`}>
                  <Clock className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                    Beklemede
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {kpiStats.pendingIssues}
                  </p>
                </div>
              </div>
            </div>

            {/* Çözülen Sorunlar */}
            <div className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-slate-850 border-slate-700/50' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-green-600/20' : 'bg-green-100'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                    Çözüldü
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {kpiStats.resolvedIssues}
                  </p>
                </div>
              </div>
            </div>

            {/* Aktif Çalışanlar */}
            <div className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-slate-850 border-slate-700/50' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                  <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                    Aktif Çalışan
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {kpiStats.activeWorkers}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Araç Çubuğu */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* İstatistikler */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
              <FileText className="w-5 h-5" />
              <span className="text-lg font-semibold">{filteredNotes.length}</span>
              <span className={isDark ? 'text-concrete-500' : 'text-gray-500'}>
                {filteredNotes.length === 1 ? 'Not' : 'Not'}
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-safety-orange hover:bg-safety-orange/10 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Filtreleri Temizle
              </button>
            )}
          </div>

          {/* Görünüm Değiştirici & Filtre Butonu */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Görünüm Modu */}
            <div className={`flex rounded-lg p-1 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-concrete-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Izgara görünümü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                    : isDark ? 'text-concrete-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Liste görünümü"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filtre Butonu (Sadece Yönetici) */}
            {isAdmin && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-safety-orange/20 text-safety-orange'
                    : isDark 
                      ? 'bg-slate-800 text-concrete-300 hover:text-white' 
                      : 'bg-gray-200 text-gray-600 hover:text-gray-800'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filtreler</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-safety-orange rounded-full" />
                )}
              </button>
            )}

            {/* Export Butonu (Sadece Yönetici) */}
            {isAdmin && (
              <button
                onClick={exportToCSV}
                disabled={filteredNotes.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark 
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Dışa Aktar</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtre Paneli (Sadece Yönetici) */}
        {isAdmin && showFilters && (
          <div className={`rounded-xl border p-4 mb-6 animate-slide-up ${
            isDark 
              ? 'bg-slate-850 border-slate-700/50' 
              : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Çalışan Filtresi */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                  Çalışan
                </label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <select
                    value={filters.workerEmail}
                    onChange={(e) => setFilters({ ...filters, workerEmail: e.target.value })}
                    className={`w-full rounded-lg pl-10 pr-8 py-3 appearance-none focus:outline-none focus:border-safety-orange transition-colors ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Tüm Çalışanlar</option>
                    {workerEmails.map(email => (
                      <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                </div>
              </div>

              {/* Proje Filtresi */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                  Proje
                </label>
                <div className="relative">
                  <FolderOpen className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <select
                    value={filters.projectName}
                    onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
                    className={`w-full rounded-lg pl-10 pr-8 py-3 appearance-none focus:outline-none focus:border-safety-orange transition-colors ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Tüm Projeler</option>
                    {projectNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                </div>
              </div>

              {/* Başlangıç Tarihi */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                  Başlangıç Tarihi
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className={`w-full rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-safety-orange transition-colors ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* Bitiş Tarihi */}
              <div>
                <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                  Bitiş Tarihi
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className={`w-full rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-safety-orange transition-colors ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notlar Gösterimi */}
        {loading ? (
          <NotesGridSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Notlar Yüklenirken Hata
            </h3>
            <p className={isDark ? 'text-concrete-400' : 'text-gray-500'}>{error}</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              isDark ? 'bg-slate-800' : 'bg-gray-200'
            }`}>
              <FileText className={`w-10 h-10 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {hasActiveFilters ? 'Eşleşen not bulunamadı' : 'Henüz not yok'}
            </h3>
            <p className={`mb-6 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
              {hasActiveFilters
                ? 'Aradığınızı bulmak için filtreleri değiştirmeyi deneyin.'
                : 'İlk notunuzu ekleyerek saha sorunlarını belgelemeye başlayın.'}
            </p>
            {!isAdmin && !hasActiveFilters && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-safety-orange hover:bg-safety-orange-dark text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                İlk Notunuzu Ekleyin
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'masonry-grid' : 'space-y-4'}>
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => handleNoteClick(note)}
                onEdit={() => handleEditNote(note)}
                onDelete={() => handleDeleteNote(note)}
                onStatusChange={isAdmin ? updateNoteStatus : undefined}
                showWorkerInfo={isAdmin}
                isAdmin={isAdmin}
                canEdit={canEditNote(note)}
                canDelete={canDeleteNote(note)}
                commentCount={note.comments?.length || 0}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB - Not Ekle (Sadece Çalışanlar) */}
      {!isAdmin && (
        <button
          onClick={() => setShowAddModal(true)}
          disabled={uploading}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-safety-orange to-safety-orange-dark hover:from-safety-orange-dark hover:to-safety-orange text-white rounded-full shadow-industrial-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 z-30"
        >
          {uploading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Plus className="w-7 h-7" />
          )}
        </button>
      )}

      {/* Modallar */}
      <AddNoteModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onSubmit={handleSubmitNote}
        editNote={editingNote}
        uploadProgress={uploadProgress}
      />

      <NoteDetailModal
        note={selectedNote}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNote(null);
        }}
        onAddComment={handleAddComment}
        onDeleteComment={deleteComment}
        onEdit={(note) => {
          setShowDetailModal(false);
          handleEditNote(note);
        }}
        canEdit={selectedNote ? canEditNote(selectedNote) : false}
      />

      {/* Profil Ayarları Modal */}
      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />

      {/* Kullanıcı Yönetimi Modal (Sadece Admin) */}
      {isAdmin && (
        <UserManagement
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
