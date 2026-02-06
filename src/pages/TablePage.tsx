import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Sun,
  Moon,
  Pencil,
  Trash2,
  ArrowLeft,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotes } from '../hooks/useNotes';
import { Note, NoteFormData, normalizeStatus, NOTE_STATUS_CONFIG } from '../types';
import AddNoteModal from '../components/AddNoteModal';
import UserProfileMenu from '../components/UserProfileMenu';
import ProfileSettings from '../components/ProfileSettings';
import UserManagement from '../components/UserManagement';
import LoadingSpinner from '../components/LoadingSpinner';

type SortField = 'projectName' | 'createdAt' | null;
type SortDir = 'asc' | 'desc';

const TablePage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { logout, isAdmin } = useAuth();
  const {
    notes,
    loading,
    error,
    updateNote,
    deleteNote,
    canEditNote,
    canDeleteNote
  } = useNotes();

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  // Use all notes (no filter) for table view - can be changed to filtered if needed
  const displayNotes = useMemo(() => {
    let list = [...notes];
    if (sortField) {
      list.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        if (sortField === 'projectName') {
          aVal = (a.projectName || '').toLowerCase();
          bVal = (b.projectName || '').toLowerCase();
        } else if (sortField === 'createdAt') {
          aVal = a.createdAt?.toDate?.()?.getTime() || 0;
          bVal = b.createdAt?.toDate?.()?.getTime() || 0;
        }
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [notes, sortField, sortDir]);

  const formatDate = (timestamp: { toDate?: () => Date } | undefined) => {
    if (!timestamp?.toDate) return '-';
    const d = timestamp.toDate();
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const exportToCSV = useCallback(() => {
    const BOM = '\uFEFF';
    const getStatusLabel = (s: string) => NOTE_STATUS_CONFIG[normalizeStatus(s)]?.label || 'Eksik';
    const escape = (v: string) => {
      if (!v) return '';
      return `"${String(v).replace(/"/g, '""')}"`;
    };
    const headers = ['#', 'Proje İsmi', 'Ada / Parsel', 'Kategori', 'Hakediş / Seviye', 'Oluşturulma Tarihi', 'Durum'];
    const rows = displayNotes.map((note, i) => [
      String(i + 1),
      note.projectName || '',
      `${note.ada || '-'} / ${note.parsel || '-'}`,
      '-',
      note.progressLevel || '-',
      formatDate(note.createdAt),
      getStatusLabel(note.status)
    ].map(v => escape(String(v))).join(','));
    const csv = BOM + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `saha-tablo-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, [displayNotes]);

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setShowAddModal(true);
  };

  const handleDeleteNote = async (note: Note) => {
    if (!canDeleteNote(note)) return;
    if (!confirm(`${note.projectName || 'Bu not'} silinsin mi?`)) return;
    try {
      await deleteNote(note);
    } catch (err) {
      console.error('Not silinirken hata:', err);
    }
  };

  const handleSubmitNote = async (formData: NoteFormData, existingImageUrls?: string[]) => {
    if (!editingNote) return;
    await updateNote(
      editingNote.id,
      formData,
      formData.images.length > 0 ? formData.images : undefined,
      existingImageUrls
    );
    setEditingNote(null);
    setShowAddModal(false);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Tablo yükleniyor..." />;
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 border-b transition-colors ${
        isDark ? 'bg-slate-850 border-slate-700/50' : 'bg-white border-gray-200 shadow-sm'
      }`}>
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Ana Sayfa"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className={`w-5 h-5 ${isDark ? 'text-safety-orange' : 'text-safety-orange-dark'}`} />
                <div>
                  <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Tablo Görünümü
                  </h1>
                  <p className={`text-xs ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                    {displayNotes.length} not
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportToCSV}
                disabled={displayNotes.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                <Download className="w-4 h-4" />
                Excel'e Aktar
              </button>
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-yellow-400 hover:bg-slate-700/50' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <UserProfileMenu
                onOpenProfileSettings={() => setShowProfileSettings(true)}
                onOpenUserManagement={() => setShowUserManagement(true)}
                onLogout={logout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Table */}
      <main className="max-w-full mx-auto px-4 py-4 overflow-x-auto">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className={`rounded-lg border overflow-hidden ${
          isDark ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className={`sticky top-0 z-10 ${isDark ? 'bg-gray-800 text-white' : 'bg-gray-800 text-white'}`}>
                <th className="py-2 px-3 text-left font-semibold border-r border-gray-700/50 w-12">#</th>
                <th
                  className="py-2 px-3 text-left font-semibold border-r border-gray-700/50 cursor-pointer hover:bg-gray-700/50 select-none"
                  onClick={() => handleSort('projectName')}
                >
                  <span className="flex items-center gap-1">
                    Proje İsmi
                    {sortField === 'projectName' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </span>
                </th>
                <th className="py-2 px-3 text-left font-semibold border-r border-gray-700/50 font-mono">Ada / Parsel</th>
                <th className="py-2 px-3 text-left font-semibold border-r border-gray-700/50">Kategori</th>
                <th className="py-2 px-3 text-left font-semibold border-r border-gray-700/50">Hakediş / Seviye</th>
                <th
                  className="py-2 px-3 text-left font-semibold border-r border-gray-700/50 cursor-pointer hover:bg-gray-700/50 select-none font-mono"
                  onClick={() => handleSort('createdAt')}
                >
                  <span className="flex items-center gap-1">
                    Oluşturulma Tarihi
                    {sortField === 'createdAt' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </span>
                </th>
                <th className="py-2 px-3 text-left font-semibold border-r border-gray-700/50">Durum</th>
                <th className="py-2 px-3 text-left font-semibold w-24">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {displayNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`py-8 text-center ${isDark ? 'text-concrete-500' : 'text-gray-500'}`}>
                    Henüz not bulunmuyor
                  </td>
                </tr>
              ) : (
                displayNotes.map((note, idx) => {
                  const status = normalizeStatus(note.status);
                  return (
                    <tr
                      key={note.id}
                      className={`border-t transition-colors ${
                        isDark
                          ? 'border-slate-700/50 hover:bg-slate-800/50'
                          : 'border-gray-200 hover:bg-blue-50'
                      } ${idx % 2 === 1 ? (isDark ? 'bg-slate-900/30' : 'bg-gray-50') : ''}`}
                    >
                      <td className={`py-2 px-3 font-mono ${isDark ? 'text-concrete-300' : 'text-gray-600'}`}>
                        {idx + 1}
                      </td>
                      <td className={`py-2 px-3 border-r ${isDark ? 'border-slate-700/50 text-white' : 'border-gray-200 text-gray-900'}`}>
                        {note.projectName || '-'}
                      </td>
                      <td className={`py-2 px-3 border-r font-mono ${isDark ? 'border-slate-700/50 text-concrete-300' : 'border-gray-200 text-gray-700'}`}>
                        {note.ada || '-'} / {note.parsel || '-'}
                      </td>
                      <td className={`py-2 px-3 border-r ${isDark ? 'border-slate-700/50 text-concrete-400' : 'border-gray-200 text-gray-600'}`}>
                        -
                      </td>
                      <td className={`py-2 px-3 border-r ${isDark ? 'border-slate-700/50 text-concrete-300' : 'border-gray-200 text-gray-700'}`}>
                        {note.progressLevel || '-'}
                      </td>
                      <td className={`py-2 px-3 border-r font-mono ${isDark ? 'border-slate-700/50 text-concrete-300' : 'border-gray-200 text-gray-700'}`}>
                        {formatDate(note.createdAt)}
                      </td>
                      <td className={`py-2 px-3 border-r ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            status === 'Onay'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {NOTE_STATUS_CONFIG[status]?.label || 'Eksik'}
                        </span>
                      </td>
                      <td className={`py-2 px-3 ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-1">
                          {canEditNote(note) && (
                            <button
                              onClick={() => handleEditNote(note)}
                              className={`p-1.5 rounded transition-colors ${
                                isDark ? 'hover:bg-slate-700 text-concrete-300' : 'hover:bg-gray-200 text-gray-600'
                              }`}
                              title="Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteNote(note) && (
                            <button
                              onClick={() => handleDeleteNote(note)}
                              className="p-1.5 rounded transition-colors hover:bg-red-500/20 text-red-400"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modals */}
      <AddNoteModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingNote(null); }}
        onSubmit={handleSubmitNote}
        editNote={editingNote}
      />
      <ProfileSettings
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
      {isAdmin && (
        <UserManagement
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
        />
      )}
    </div>
  );
};

export default TablePage;
