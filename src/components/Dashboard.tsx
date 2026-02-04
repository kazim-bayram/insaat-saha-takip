import React, { useState, useMemo } from 'react';
import {
  Plus,
  LogOut,
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
  Moon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotes } from '../hooks/useNotes';
import { Note, FilterOptions } from '../types';
import NoteCard from './NoteCard';
import NoteDetailModal from './NoteDetailModal';
import AddNoteModal from './AddNoteModal';
import LoadingSpinner, { NotesGridSkeleton } from './LoadingSpinner';

const Dashboard: React.FC = () => {
  const { userProfile, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    notes,
    loading,
    error,
    uploading,
    createNote,
    updateNote,
    deleteNote,
    filterNotes,
    getProjectNames,
    getWorkerEmails
  } = useNotes();

  // Modal durumları
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

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

  const handleSubmitNote = async (formData: { title: string; content: string; projectName: string; image: File | null }) => {
    if (editingNote) {
      await updateNote(editingNote.id, formData, formData.image || undefined);
    } else {
      await createNote(formData);
    }
    setEditingNote(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
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

              {/* Kullanıcı Rozeti */}
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                isDark ? 'bg-slate-700/50' : 'bg-gray-100'
              }`}>
                <User className={`w-4 h-4 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`} />
                <span className={`text-sm ${isDark ? 'text-concrete-200' : 'text-gray-700'}`}>
                  {userProfile?.displayName}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  isAdmin 
                    ? 'bg-safety-orange/20 text-safety-orange' 
                    : isDark 
                      ? 'bg-steel-600/20 text-steel-300' 
                      : 'bg-blue-100 text-blue-700'
                }`}>
                  {isAdmin ? 'Yönetici' : 'Çalışan'}
                </span>
              </div>

              {/* Çıkış Butonu */}
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto px-4 py-6">
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
                onEdit={!isAdmin ? () => handleEditNote(note) : undefined}
                onDelete={!isAdmin ? () => handleDeleteNote(note) : undefined}
                showWorkerInfo={isAdmin}
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
      />

      <NoteDetailModal
        note={selectedNote}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedNote(null);
        }}
      />
    </div>
  );
};

export default Dashboard;
