import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  X,
  Calendar,
  FolderOpen,
  User,
  LayoutGrid,
  List,
  FileText,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Download,
  CheckCircle2,
  XCircle,
  Users,
  BarChart3,
  Search,
  MapPin,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotes } from '../hooks/useNotes';
import { Note, FilterOptions, NOTE_STATUS_CONFIG, NoteFormData, getNoteImages, normalizeStatus } from '../types';
import NoteCard from './NoteCard';
import NoteDetailModal from './NoteDetailModal';
import AddNoteModal from './AddNoteModal';
import ProfileSettings from './ProfileSettings';
import UserManagement from './UserManagement';
import UserProfileMenu from './UserProfileMenu';
import LoadingSpinner, { NotesGridSkeleton } from './LoadingSpinner';

const Dashboard: React.FC = () => {
  const { logout, isAdmin } = useAuth();
  const { toggleTheme, isDark } = useTheme();
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
    getWorkerNames,
    getKPIStats
  } = useNotes();

  // Modal durumları
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Görünüm durumu
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Filtre durumu
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    workerEmail: '',
    projectName: '',
    ada: '',
    parsel: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  // Filtreleri uygula - works for both admin and workers
  const filteredNotes = useMemo(() => {
    return filterNotes(filters);
  }, [notes, filters, filterNotes]);

  // Filtre dropdown'ları için benzersiz değerler
  const projectNames = useMemo(() => getProjectNames(), [getProjectNames]);
  const workerNames = useMemo(() => getWorkerNames(), [getWorkerNames]);

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
      const normalized = normalizeStatus(status);
      return NOTE_STATUS_CONFIG[normalized]?.label || 'Eksik';
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
        escapeCSV(getStatusLabel(note.status)),
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
    } else {
      await createNote(formData);
    }
    setEditingNote(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
  };

  // Handle adding comment
  const handleAddComment = async (noteId: string, text: string) => {
    const comment = await addComment(noteId, text);
    return comment;
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      workerEmail: '',
      projectName: '',
      ada: '',
      parsel: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const hasActiveFilters = filters.searchQuery || filters.workerEmail || filters.projectName || 
                            filters.ada || filters.parsel || filters.status || filters.dateFrom || filters.dateTo;

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
                {/* Construction Plan / Map / Parcel Icon */}
                <svg 
                  className="w-5 h-5 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="9" y1="3" x2="9" y2="21" />
                  <line x1="15" y1="9" x2="15" y2="21" />
                  <circle cx="6" cy="6" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Saha Takip</h1>
                <p className={`text-xs ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                  {isAdmin ? 'Yönetici Paneli' : 'Saha Notları'}
                </p>
              </div>
            </div>

            {/* Kullanıcı Bilgisi & Aksiyonlar */}
            <div className="flex items-center gap-2">
              {/* Search/Filter Toggle Button */}
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`relative p-2 rounded-lg transition-colors ${
                  isFiltersOpen || hasActiveFilters
                    ? 'bg-safety-orange/20 text-safety-orange'
                    : isDark 
                      ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50' 
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Ara ve Filtrele"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-safety-orange rounded-full border-2 border-slate-850" />
                )}
              </button>

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

        {/* Collapsible Filter Panel */}
        <div 
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isFiltersOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={`border-t ${isDark ? 'border-slate-700/50 bg-slate-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto px-4 py-4">
              {/* Search Bar - Full Width */}
              <div className="mb-4">
                <div className="relative">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    placeholder="Proje adı veya içerikte ara..."
                    className={`w-full rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-safety-orange/20 focus:border-safety-orange transition-all ${
                      isDark 
                        ? 'bg-slate-800 border border-slate-600 text-white placeholder-concrete-500' 
                        : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
                    }`}
                  />
                </div>
              </div>

              {/* Filter Grid - Responsive */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {/* Ada (Island) */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                    Ada
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={filters.ada}
                      onChange={(e) => setFilters({ ...filters, ada: e.target.value })}
                      placeholder="Ada No"
                      className={`w-full rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-safety-orange transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border border-slate-600 text-white placeholder-concrete-500' 
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                {/* Parsel (Parcel) */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                    Parsel
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={filters.parsel}
                      onChange={(e) => setFilters({ ...filters, parsel: e.target.value })}
                      placeholder="Parsel No"
                      className={`w-full rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-safety-orange transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border border-slate-600 text-white placeholder-concrete-500' 
                          : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                {/* Project Dropdown */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                    Proje
                  </label>
                  <div className="relative">
                    <FolderOpen className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                    <select
                      value={filters.projectName}
                      onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
                      className={`w-full rounded-lg pl-9 pr-8 py-2.5 text-sm appearance-none focus:outline-none focus:border-safety-orange transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border border-slate-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900 shadow-sm'
                      }`}
                    >
                      <option value="">Tümü</option>
                      {projectNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  </div>
                </div>

                {/* Status Dropdown (Eksik / Onay) */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                    Durum
                  </label>
                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className={`w-full rounded-lg pl-3 pr-8 py-2.5 text-sm appearance-none focus:outline-none focus:border-safety-orange transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border border-slate-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900 shadow-sm'
                      }`}
                    >
                      <option value="">Tümü</option>
                      <option value="Eksik">🔴 Eksik</option>
                      <option value="Onay">🟢 Onay</option>
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                  </div>
                </div>

                {/* Worker Dropdown (Admin only) */}
                {isAdmin && (
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                      Çalışan
                    </label>
                    <div className="relative">
                      <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                      <select
                        value={filters.workerEmail}
                        onChange={(e) => setFilters({ ...filters, workerEmail: e.target.value })}
                        className={`w-full rounded-lg pl-9 pr-8 py-2.5 text-sm appearance-none focus:outline-none focus:border-safety-orange transition-colors ${
                          isDark 
                            ? 'bg-slate-800 border border-slate-600 text-white' 
                            : 'bg-white border border-gray-300 text-gray-900 shadow-sm'
                        }`}
                      >
                        <option value="">Tümü</option>
                        {workerNames.map(worker => (
                          <option key={worker.email} value={worker.email}>{worker.name}</option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                    </div>
                  </div>
                )}

                {/* Date Picker */}
                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                    Tarih
                  </label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-concrete-500' : 'text-gray-400'}`} />
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value, dateTo: e.target.value })}
                      className={`w-full rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-safety-orange transition-colors ${
                        isDark 
                          ? 'bg-slate-800 border border-slate-600 text-white' 
                          : 'bg-white border border-gray-300 text-gray-900 shadow-sm'
                      }`}
                    />
                  </div>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      clearFilters();
                    }}
                    disabled={!hasActiveFilters}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      hasActiveFilters
                        ? 'bg-safety-orange text-white hover:bg-safety-orange-dark'
                        : isDark 
                          ? 'bg-slate-800 text-concrete-400 border border-slate-600' 
                          : 'bg-white text-gray-500 border border-gray-300'
                    }`}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Sıfırla
                  </button>
                </div>

                {/* Close Button */}
                <div className="flex items-end">
                  <button
                    onClick={() => setIsFiltersOpen(false)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-slate-800 text-concrete-300 hover:text-white border border-slate-600' 
                        : 'bg-white text-gray-600 hover:text-gray-800 border border-gray-300 shadow-sm'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    Kapat
                  </button>
                </div>
              </div>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <div className={`mt-3 pt-3 border-t flex items-center gap-2 flex-wrap ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
                  <span className={`text-xs font-medium ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>Aktif:</span>
                  {filters.searchQuery && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      "{filters.searchQuery}"
                      <button onClick={() => setFilters({ ...filters, searchQuery: '' })} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.ada && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      Ada: {filters.ada}
                      <button onClick={() => setFilters({ ...filters, ada: '' })} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.parsel && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      Parsel: {filters.parsel}
                      <button onClick={() => setFilters({ ...filters, parsel: '' })} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.projectName && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      {filters.projectName}
                      <button onClick={() => setFilters({ ...filters, projectName: '' })} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.status && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      {filters.status === 'Eksik' ? '🔴' : '🟢'} {filters.status}
                      <button onClick={() => setFilters({ ...filters, status: '' })} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.workerEmail && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      {workerNames.find(w => w.email === filters.workerEmail)?.name || filters.workerEmail}
                      <button onClick={() => setFilters({ ...filters, workerEmail: '' })} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {filters.dateFrom && (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-gray-700 shadow-sm'}`}>
                      {new Date(filters.dateFrom).toLocaleDateString('tr-TR')}
                      <button onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })} className="hover:text-red-400 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
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

            {/* Eksik (Missing) */}
            <div className={`rounded-xl p-4 border ${
              isDark 
                ? 'bg-slate-850 border-slate-700/50' 
                : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${isDark ? 'bg-red-600/20' : 'bg-red-100'}`}>
                  <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className={`text-xs font-medium ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                    Eksik
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    {kpiStats.eksikCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Onay (Approved) */}
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
                    Onay
                  </p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {kpiStats.onayCount}
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
              {hasActiveFilters && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-safety-orange/20 text-safety-orange' : 'bg-orange-100 text-orange-700'}`}>
                  Filtrelenmiş
                </span>
              )}
            </div>
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
            {!hasActiveFilters && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-safety-orange hover:bg-safety-orange-dark text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                {isAdmin ? 'Yeni Not Ekle' : 'İlk Notunuzu Ekleyin'}
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

      {/* FAB - Not Ekle (Çalışanlar ve Yöneticiler) */}
      <button
        onClick={() => setShowAddModal(true)}
        disabled={uploading}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-safety-orange to-safety-orange-dark hover:from-safety-orange-dark hover:to-safety-orange text-white rounded-full shadow-industrial-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 z-30"
        title="Yeni Not Ekle"
      >
        {uploading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Plus className="w-7 h-7" />
        )}
      </button>

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
