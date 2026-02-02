import React, { useState, useMemo } from 'react';
import {
  Plus,
  LogOut,
  Filter,
  X,
  Search,
  Calendar,
  FolderOpen,
  User,
  LayoutGrid,
  List,
  HardHat,
  FileText,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../hooks/useNotes';
import { Note, FilterOptions } from '../types';
import NoteCard from './NoteCard';
import NoteDetailModal from './NoteDetailModal';
import AddNoteModal from './AddNoteModal';
import LoadingSpinner, { NotesGridSkeleton } from './LoadingSpinner';

const Dashboard: React.FC = () => {
  const { userProfile, logout, isAdmin } = useAuth();
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

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    workerEmail: '',
    projectName: '',
    dateFrom: '',
    dateTo: ''
  });

  // Apply filters
  const filteredNotes = useMemo(() => {
    if (!isAdmin) return notes;
    return filterNotes(filters);
  }, [notes, filters, filterNotes, isAdmin]);

  // Get unique values for filter dropdowns
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
      console.error('Failed to delete note:', err);
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
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-850 border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-safety-orange to-safety-orange-dark rounded-xl flex items-center justify-center">
                <HardHat className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">SiteNotes</h1>
                <p className="text-xs text-concrete-400">
                  {isAdmin ? 'Admin Dashboard' : 'Field Notes'}
                </p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-3">
              {/* User Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg">
                <User className="w-4 h-4 text-concrete-400" />
                <span className="text-sm text-concrete-200">{userProfile?.displayName}</span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  isAdmin 
                    ? 'bg-safety-orange/20 text-safety-orange' 
                    : 'bg-steel-600/20 text-steel-300'
                }`}>
                  {isAdmin ? 'Admin' : 'Worker'}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-concrete-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-concrete-300">
              <FileText className="w-5 h-5" />
              <span className="text-lg font-semibold">{filteredNotes.length}</span>
              <span className="text-concrete-500">
                {filteredNotes.length === 1 ? 'Note' : 'Notes'}
              </span>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-safety-orange hover:bg-safety-orange/10 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {/* View Toggle & Filter Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-700 text-white'
                    : 'text-concrete-400 hover:text-white'
                }`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-700 text-white'
                    : 'text-concrete-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Button (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters || hasActiveFilters
                    ? 'bg-safety-orange/20 text-safety-orange'
                    : 'bg-slate-800 text-concrete-300 hover:text-white'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-safety-orange rounded-full" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel (Admin Only) */}
        {isAdmin && showFilters && (
          <div className="bg-slate-850 rounded-xl border border-slate-700/50 p-4 mb-6 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Worker Filter */}
              <div>
                <label className="block text-concrete-400 text-xs font-medium mb-2">
                  Worker
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-concrete-500" />
                  <select
                    value={filters.workerEmail}
                    onChange={(e) => setFilters({ ...filters, workerEmail: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-8 py-3 text-white appearance-none focus:outline-none focus:border-safety-orange transition-colors"
                  >
                    <option value="">All Workers</option>
                    {workerEmails.map(email => (
                      <option key={email} value={email}>{email}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-concrete-500 pointer-events-none" />
                </div>
              </div>

              {/* Project Filter */}
              <div>
                <label className="block text-concrete-400 text-xs font-medium mb-2">
                  Project
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-concrete-500" />
                  <select
                    value={filters.projectName}
                    onChange={(e) => setFilters({ ...filters, projectName: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-8 py-3 text-white appearance-none focus:outline-none focus:border-safety-orange transition-colors"
                  >
                    <option value="">All Projects</option>
                    {projectNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-concrete-500 pointer-events-none" />
                </div>
              </div>

              {/* Date From */}
              <div>
                <label className="block text-concrete-400 text-xs font-medium mb-2">
                  From Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-concrete-500" />
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-safety-orange transition-colors"
                  />
                </div>
              </div>

              {/* Date To */}
              <div>
                <label className="block text-concrete-400 text-xs font-medium mb-2">
                  To Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-concrete-500" />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-safety-orange transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Display */}
        {loading ? (
          <NotesGridSkeleton count={6} />
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Notes</h3>
            <p className="text-concrete-400">{error}</p>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-concrete-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {hasActiveFilters ? 'No matching notes' : 'No notes yet'}
            </h3>
            <p className="text-concrete-400 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Start documenting site issues by adding your first note.'}
            </p>
            {!isAdmin && !hasActiveFilters && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-safety-orange hover:bg-safety-orange-dark text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Your First Note
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

      {/* FAB - Add Note (Workers Only) */}
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

      {/* Modals */}
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
