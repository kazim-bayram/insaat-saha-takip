import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Trash2,
  ArrowLeft,
  FileSpreadsheet,
  Settings2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotes, sortByNewestFirst } from '../hooks/useNotes';
import { useNoteSchema } from '../hooks/useNoteSchema';
import { Note, NoteFormData, normalizeStatus, NOTE_STATUS_CONFIG, getWorkDate, formatWorkDate, getNoteFieldValue, CATEGORY_OPTIONS, normalizeCategoryKey } from '../types';
import { CATEGORY_SCHEMAS, ZABIT_CATEGORY, TEBLIGAT_CATEGORY, KENTSEL_CATEGORY } from '../config/categorySchemas';
import AddNoteModal from '../components/AddNoteModal';
import NoteDetailModal from '../components/NoteDetailModal';
import UserProfileMenu from '../components/UserProfileMenu';
import ProfileSettings from '../components/ProfileSettings';
import UserManagement from '../components/UserManagement';
import LoadingSpinner from '../components/LoadingSpinner';

const CORE_FIELD_IDS = ['category', 'ada', 'parsel', 'date', 'progressLevel'] as const;

type SortField = 'projectName' | 'date' | 'category' | null;
type SortDir = 'asc' | 'desc';
type ActiveTab = 'genel' | 'zabit' | 'tebligat' | 'kentsel';

/** Unified column type for genel (FormField) and zabit/tebligat (CategoryField) */
interface TabDisplayField {
  id: string;
  label: string;
  type: string;
  options?: string[];
  showInTable?: boolean;
  showInFilter?: boolean;
}

const TablePage: React.FC = () => {
  const { isDark } = useTheme();
  const { logout, isAdmin, currentUser, userProfile } = useAuth();
  const { schema } = useNoteSchema();
  const schemaFields = [...(schema?.fields ?? [])].sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

  const isWorker = userProfile?.role === 'worker';
  const [activeTab, setActiveTab] = useState<ActiveTab>('genel');

  const zabitFieldIds = useMemo(() => CATEGORY_SCHEMAS[ZABIT_CATEGORY]?.map((f) => f.id) ?? [], []);
  const tebligatFieldIds = useMemo(() => CATEGORY_SCHEMAS[TEBLIGAT_CATEGORY]?.map((f) => f.id) ?? [], []);
  const kentselFieldIds = useMemo(() => CATEGORY_SCHEMAS[KENTSEL_CATEGORY]?.map((f) => f.id) ?? [], []);

  const tableDisplayFields = useMemo(
    () =>
      schemaFields.filter(
        (f) => CORE_FIELD_IDS.includes(f.id as (typeof CORE_FIELD_IDS)[number]) || f.showInTable
      ),
    [schemaFields]
  );

  const tabDisplayFields = useMemo((): TabDisplayField[] => {
    if (activeTab === 'genel') {
      return tableDisplayFields.filter(
        (f) => !zabitFieldIds.includes(f.id) && !tebligatFieldIds.includes(f.id) && !kentselFieldIds.includes(f.id)
      ).map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options,
        showInTable: f.showInTable,
        showInFilter: f.showInFilter
      }));
    }
    if (activeTab === 'zabit') {
      const core: TabDisplayField[] = [
        { id: 'ada', label: 'Ada', type: 'text' },
        { id: 'parsel', label: 'Parsel', type: 'text' },
        { id: 'date', label: 'Tarih', type: 'date' }
      ];
      const zabit = (CATEGORY_SCHEMAS[ZABIT_CATEGORY] ?? []).map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options
      }));
      return [...core, ...zabit];
    }
    if (activeTab === 'tebligat') {
      const core: TabDisplayField[] = [
        { id: 'ada', label: 'Ada', type: 'text' },
        { id: 'parsel', label: 'Parsel', type: 'text' },
        { id: 'date', label: 'Tarih', type: 'date' }
      ];
      const tebligat = (CATEGORY_SCHEMAS[TEBLIGAT_CATEGORY] ?? []).map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options
      }));
      return [...core, ...tebligat];
    }
    if (activeTab === 'kentsel') {
      const core: TabDisplayField[] = [
        { id: 'ada', label: 'Ada', type: 'text' },
        { id: 'parsel', label: 'Parsel', type: 'text' },
        { id: 'date', label: 'Tarih', type: 'date' }
      ];
      const kentsel = (CATEGORY_SCHEMAS[KENTSEL_CATEGORY] ?? []).map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        options: f.options
      }));
      return [...core, ...kentsel];
    }
    return tableDisplayFields.map((f) => ({
      id: f.id,
      label: f.label,
      type: f.type,
      options: f.options,
      showInTable: f.showInTable,
      showInFilter: f.showInFilter
    }));
  }, [activeTab, tableDisplayFields, zabitFieldIds, tebligatFieldIds, kentselFieldIds]);
  const {
    notes,
    loading,
    error,
    updateNote,
    updateNoteField,
    deleteNote,
    addComment,
    deleteComment,
    canEditNote,
    canDeleteNote
  } = useNotes();

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filters, setFilters] = useState({
    project: '',
    adaParsel: '',
    category: '',
    progress: '',
    status: '',
    worker: ''
  });
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{ id: string; field: string; value: string } | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [dummyScrollWidth, setDummyScrollWidth] = useState(1000);

  const canEditInline = isAdmin;

  const handleTopScroll = () => {
    if (tableScrollRef.current && topScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleTableScroll = () => {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  // Apply tab-based category filter first, then column filters (AND logic, case-insensitive)
  const filteredNotes = useMemo(() => {
    let base: Note[] = notes;

    if (activeTab === 'genel') {
      base = notes.filter((n) => {
        const rawCat = String(getNoteFieldValue(n, 'category') || n.category || '').trim();
        const cat = normalizeCategoryKey(rawCat);
        return cat !== ZABIT_CATEGORY && cat !== TEBLIGAT_CATEGORY && cat !== KENTSEL_CATEGORY;
      });
    } else if (activeTab === 'zabit') {
      base = notes.filter((n) => {
        const rawCat = String(getNoteFieldValue(n, 'category') || n.category || '').trim();
        const cat = normalizeCategoryKey(rawCat);
        return cat === ZABIT_CATEGORY;
      });
    } else if (activeTab === 'tebligat') {
      base = notes.filter((n) => {
        const rawCat = String(getNoteFieldValue(n, 'category') || n.category || '').trim();
        const cat = normalizeCategoryKey(rawCat);
        return cat === TEBLIGAT_CATEGORY;
      });
    } else if (activeTab === 'kentsel') {
      base = notes.filter((n) => {
        const rawCat = String(getNoteFieldValue(n, 'category') || n.category || '').trim();
        const cat = normalizeCategoryKey(rawCat);
        return cat === KENTSEL_CATEGORY;
      });
    }

    return base.filter((note) => {
      if (isWorker && currentUser && (note.userId == null || note.userId !== currentUser.uid)) return false;
      const projectMatch = !filters.project || String(note?.projectName ?? '').toLowerCase().includes(String(filters.project ?? '').toLowerCase());
      const adaParselStr = `${getNoteFieldValue(note, 'ada') || ''}/${getNoteFieldValue(note, 'parsel') || ''}`.toLowerCase();
      const adaParselMatch = !filters.adaParsel || adaParselStr.includes(filters.adaParsel.toLowerCase());
      const categoryValRaw = String(getNoteFieldValue(note, 'category') || note.category || '');
      const categoryVal = normalizeCategoryKey(categoryValRaw);
      const categoryMatch = !filters.category || categoryVal.toLowerCase().includes(filters.category.toLowerCase());
      const progressVal = String(getNoteFieldValue(note, 'progressLevel') || '');
      const progressMatch = !filters.progress || progressVal.toLowerCase().includes(filters.progress.toLowerCase());
      const workerVal = String(note?.userName ?? note?.userEmail ?? '').toLowerCase();
      const workerMatch = !filters.worker || workerVal.includes(filters.worker.toLowerCase());
      const noteStatus = normalizeStatus(note?.status);
      const statusMatch = !filters.status || noteStatus === filters.status;
      const dateMatch = !filterDate || getWorkDate(note) === filterDate;
      let dynamicMatch = true;
      tabDisplayFields.forEach((f) => {
        const filterVal = dynamicFilters[f.id]?.trim();
        if (!filterVal) return;
        const cellVal = getNoteFieldValue(note, f.id);
        const str = cellVal !== undefined && cellVal !== null
          ? (Array.isArray(cellVal) ? cellVal.join(' ') : String(cellVal))
          : '';
        if (!str.toLowerCase().includes(filterVal.toLowerCase())) dynamicMatch = false;
      });
      return projectMatch && adaParselMatch && categoryMatch && progressMatch && workerMatch && statusMatch && dateMatch && dynamicMatch;
    });
  }, [notes, activeTab, filters, filterDate, tabDisplayFields, dynamicFilters, zabitFieldIds, tebligatFieldIds, isWorker, currentUser]);

  // Sort filtered notes (default: newest added first)
  const displayNotes = useMemo(() => {
    let list = sortByNewestFirst(filteredNotes);
    if (sortField) {
      list.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';
        if (sortField === 'projectName') {
          aVal = (a.projectName || '').toLowerCase();
          bVal = (b.projectName || '').toLowerCase();
        } else if (sortField === 'date') {
          aVal = getWorkDate(a) || '';
          bVal = getWorkDate(b) || '';
        } else if (sortField === 'category') {
          aVal = (getNoteFieldValue(a, 'category') || a.category || '').toString().toLowerCase();
          bVal = (getNoteFieldValue(b, 'category') || b.category || '').toString().toLowerCase();
        }
        const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [filteredNotes, sortField, sortDir]);


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const parseYMDToUTCDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts.map((p) => Number(p));
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d));
  };

  const checkIfExpired = (
    startDateStr: string | null | undefined,
    daysToAdd: number | string | null | undefined
  ): boolean => {
    if (startDateStr == null || daysToAdd == null || daysToAdd === '') return false;
    const startDate = parseYMDToUTCDate(startDateStr);
    if (!startDate) return false;
    const parsedDays =
      typeof daysToAdd === 'string' ? parseInt(daysToAdd, 10) : Number(daysToAdd);
    if (!Number.isFinite(parsedDays)) return false;

    const deadline = new Date(startDate.getTime() + parsedDays * MS_PER_DAY);
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    return todayUtc.getTime() > deadline.getTime();
  };

  const getDaysLeft = (
    startDateStr: string | null | undefined,
    daysToAdd: number | string | null | undefined
  ): number | null => {
    if (startDateStr == null || daysToAdd == null || daysToAdd === '') return null;
    const startDate = parseYMDToUTCDate(startDateStr);
    if (!startDate) return null;
    const parsedDays =
      typeof daysToAdd === 'string' ? parseInt(daysToAdd, 10) : Number(daysToAdd);
    if (!Number.isFinite(parsedDays)) return null;

    const deadline = new Date(startDate.getTime() + parsedDays * MS_PER_DAY);
    const now = new Date();
    const todayUtc = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    const diffMs = deadline.getTime() - todayUtc.getTime();
    return Math.ceil(diffMs / MS_PER_DAY);
  };

  const renderDeadlineWarning = (note: Note) => {
    if (activeTab !== 'tebligat' && activeTab !== 'kentsel') return null;

    const startFieldId = activeTab === 'tebligat' ? 'teblig_tarihi' : 'karar_tarihi';
    const startDateVal = getNoteFieldValue(note, startFieldId);
    const sureGunVal = getNoteFieldValue(note, 'sure_gun');

    if (startDateVal == null || sureGunVal == null || sureGunVal === '') return null;

    const startDateStr = String(startDateVal);
    const isExpired = checkIfExpired(startDateStr, sureGunVal);

    if (isExpired) {
      return (
        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          ⏳ Süre Doldu!
        </span>
      );
    }

    const daysLeft = getDaysLeft(startDateStr, sureGunVal);
    if (daysLeft !== null && daysLeft <= 2 && daysLeft >= 0) {
      return (
        <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full">
          ⏳ {daysLeft === 0 ? 'Son Gün' : `${daysLeft} gün kaldı`}
        </span>
      );
    }

    return null;
  };

  useEffect(() => {
    const container = tableScrollRef.current;
    if (!container) return;

    const updateWidth = () => {
      const tableEl = container.querySelector('table') as HTMLTableElement | null;
      const width = tableEl?.scrollWidth || container.scrollWidth || 1000;
      setDummyScrollWidth(width);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    const tableEl = container.querySelector('table') as HTMLElement | null;
    if (tableEl) {
      resizeObserver.observe(tableEl);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [displayNotes, tabDisplayFields, activeTab]);

  const handleExport = useCallback(() => {
    const getStatusLabel = (s: string) => NOTE_STATUS_CONFIG[normalizeStatus(s)]?.label || 'Eksik';
    const adaVal = (n: Note) => getNoteFieldValue(n, 'ada');
    const parselVal = (n: Note) => getNoteFieldValue(n, 'parsel');

    // Export filteredNotes with columns matching current activeTab
    const exportData = filteredNotes.map((note, index) => {
      const base: Record<string, string | number> = {
        'Sıra': index + 1,
        'Proje İsmi': note.projectName || '-',
        'Çalışan': note.userName || note.userEmail || '-',
        'Ada/Parsel': `${adaVal(note) ?? ''} / ${parselVal(note) ?? ''}`.trim().replace(/^\s*\/\s*$/, '') || '-',
        'Tarih': getWorkDate(note) ? formatWorkDate(getWorkDate(note)) : '-',
        'Durum': getStatusLabel(note.status)
      };
      tabDisplayFields.forEach((f) => {
        const v = getNoteFieldValue(note, f.id);
        let display = '-';
        if (v !== undefined && v !== null) {
          if ((f.type === 'date' || f.id === 'date') && v) display = formatWorkDate(String(v));
          else if (Array.isArray(v)) display = v.length > 0 ? v.join(', ') : '-';
          else if (typeof v === 'boolean') display = v ? 'Evet' : '-';
          else if (v !== '') display = String(v);
        }
        base[f.label] = display;
      });
      return base as Record<string, string | number>;
    });

    const sheetName =
      activeTab === 'genel'
        ? 'Genel Raporu'
        : activeTab === 'zabit'
        ? 'Zabıt'
        : activeTab === 'tebligat'
        ? 'Tebligat'
        : 'Kentsel Dönüşüm';
    const fileName =
      activeTab === 'genel'
        ? 'Saha_Takip_Raporu'
        : activeTab === 'zabit'
        ? 'Zabit_Raporu'
        : activeTab === 'tebligat'
        ? 'Tebligat_Raporu'
        : 'Kentsel_Donusum_Raporu';
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const colWidths = [
      { wch: 5 }, { wch: 24 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 8 },
      ...tabDisplayFields.map(() => ({ wch: 14 }))
    ];
    worksheet['!cols'] = colWidths;
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }, [filteredNotes, tabDisplayFields, activeTab]);

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

  const editInputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (editingCell) {
      editInputRef.current?.focus();
    }
  }, [editingCell]);

  const handleCellSave = useCallback(
    async (noteId: string, field: string, newValue: string) => {
      if (!editingCell || editingCell.id !== noteId || editingCell.field !== field) return;
      const oldVal = String(editingCell.value ?? '');
      const trimmed = newValue.trim();
      setEditingCell(null);
      if (trimmed === oldVal) return;
      try {
        await updateNoteField(noteId, field, trimmed);
      } catch {
        // Error shown via useNotes setError
      }
    },
    [editingCell, updateNoteField]
  );

  const handleCellEdit = useCallback(
    (note: Note, field: string, currentValue: string) => {
      if (userProfile?.role !== 'admin') return;
      if (!canEditInline || !canEditNote(note)) return;
      setEditingCell({ id: note.id, field, value: currentValue });
    },
    [userProfile?.role, canEditInline, canEditNote]
  );

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
                    {filters.project || filters.adaParsel || filters.category || filters.progress || filters.worker || filters.status || filterDate ? ` (filtrelenmiş)` : ''}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              {isAdmin && (
                <Link
                  to="/form-builder"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Form Şeması"
                >
                  <Settings2 className="w-4 h-4" />
                  Form Şeması
                </Link>
              )}
              <button
                onClick={handleExport}
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
      <main className="max-w-full mx-auto px-4 py-4">
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-4 border-b border-gray-200 mb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('genel')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'genel'
                ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📁 Genel Tablo
          </button>
          <button
            onClick={() => setActiveTab('zabit')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'zabit'
                ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚖️ Zabıt
          </button>
          <button
            onClick={() => setActiveTab('tebligat')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'tebligat'
                ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Tebligat
          </button>
          <button
            onClick={() => setActiveTab('kentsel')}
            className={`pb-3 px-1 text-sm font-medium transition-colors ${
              activeTab === 'kentsel'
                ? 'border-b-2 border-blue-600 text-blue-600 font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🏗️ Kentsel Dönüşüm
          </button>
        </div>

        {/* Top Dummy Scrollbar */}
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="w-full overflow-x-auto overflow-y-hidden h-4 mb-1"
        >
          <div style={{ width: dummyScrollWidth }} className="h-full" />
        </div>

        {/* Actual Table Container */}
        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="w-full overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          <table className="w-full text-left border-collapse min-w-max text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 text-gray-700 border-b-2 border-gray-300">
                <tr>
                  <th className="sticky left-0 bg-gray-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] px-4 py-3 text-left font-semibold border-r border-gray-200 whitespace-nowrap">
                    #
                  </th>
                  <th
                    className="px-4 py-3 text-left font-semibold border-r border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap min-w-[200px]"
                    onClick={() => handleSort('projectName')}
                  >
                    <span className="flex items-center gap-1">
                      Proje İsmi
                      {sortField === 'projectName' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-r border-gray-200 whitespace-nowrap min-w-[120px]">Çalışan</th>
                  {tabDisplayFields.map((f) => (
                    <th
                      key={f.id}
                      className={`px-4 py-3 text-left font-semibold border-r border-gray-200 whitespace-nowrap min-w-[100px] ${
                        ['ada', 'parsel'].includes(f.id) ? 'font-mono' : ''
                      }`}
                    >
                      {f.label}
                    </th>
                  ))}
                  {!tabDisplayFields.some((f) => f.id === 'date') && (
                    <th
                      className="px-4 py-3 text-left font-semibold border-r border-gray-200 cursor-pointer hover:bg-gray-100 select-none font-mono whitespace-nowrap min-w-[110px]"
                      onClick={() => handleSort('date')}
                    >
                      <span className="flex items-center gap-1">
                        Tarih
                        {sortField === 'date' && (sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                      </span>
                    </th>
                  )}
                  {(activeTab === 'tebligat' || activeTab === 'kentsel') && (
                    <th className="px-4 py-3 text-left font-semibold border-r border-gray-200 whitespace-nowrap min-w-[130px]">
                      Durum Uyarı
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-semibold border-r border-gray-200 whitespace-nowrap min-w-[90px]">Durum</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap min-w-[100px]">İşlemler</th>
                </tr>
                <tr className="bg-gray-100/80 text-gray-800 border-b border-gray-200">
                  <th className="sticky left-0 bg-gray-100/80 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] px-4 py-3 border-r border-gray-200 whitespace-nowrap" />
                  <th className="px-4 py-3 border-r border-gray-200 bg-gray-100/80 whitespace-nowrap">
                    <input
                      type="text"
                      value={filters.project}
                      onChange={(e) => setFilters((f) => ({ ...f, project: e.target.value }))}
                      placeholder="Ara..."
                      className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 border-r border-gray-200 bg-gray-100/80 whitespace-nowrap shadow-[4px_0_6px_-2px_rgba(0,0,0,0.08)]">
                    <input
                      type="text"
                      value={filters.worker}
                      onChange={(e) => setFilters((prev) => ({ ...prev, worker: e.target.value }))}
                      placeholder="Ara..."
                      className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </th>
                  {tabDisplayFields.map((f) => (
                    <th key={f.id} className="px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                      {f.id === 'ada' && (
                        <input
                          type="text"
                          value={filters.adaParsel.split('/')[0]}
                          onChange={(e) => {
                            const p = filters.adaParsel.split('/');
                            setFilters((prev) => ({ ...prev, adaParsel: `${e.target.value}/${p[1] || ''}`.replace(/\/$/, '') }));
                          }}
                          placeholder="Ada..."
                          className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {f.id === 'parsel' && (
                        <input
                          type="text"
                          value={filters.adaParsel.split('/')[1] || ''}
                          onChange={(e) => {
                            const p = filters.adaParsel.split('/');
                            setFilters((prev) => ({ ...prev, adaParsel: `${p[0] || ''}/${e.target.value}`.replace(/^\//, '') }));
                          }}
                          placeholder="Parsel..."
                          className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {f.id === 'category' && (
                        <input
                          type="text"
                          value={filters.category}
                          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                          placeholder="Ara..."
                          className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {f.id === 'progressLevel' && (
                        <input
                          type="text"
                          value={filters.progress}
                          onChange={(e) => setFilters((prev) => ({ ...prev, progress: e.target.value }))}
                          placeholder="Ara..."
                          className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {f.id === 'date' && (
                        <input
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {!CORE_FIELD_IDS.includes(f.id as (typeof CORE_FIELD_IDS)[number]) && f.showInTable && f.showInFilter && (
                        <input
                          type="text"
                          value={dynamicFilters[f.id] ?? ''}
                          onChange={(e) => setDynamicFilters((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder="Ara..."
                          className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                      {!CORE_FIELD_IDS.includes(f.id as (typeof CORE_FIELD_IDS)[number]) && (!f.showInTable || !f.showInFilter) && <span className="block py-1" />}
                    </th>
                  ))}
                  {!tabDisplayFields.some((f) => f.id === 'date') && (
                    <th className="px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                      <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  {(activeTab === 'tebligat' || activeTab === 'kentsel') && (
                    <th className="px-4 py-3 border-r border-gray-200 whitespace-nowrap" />
                  )}
                  <th className="px-4 py-3 border-r border-gray-200 whitespace-nowrap">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                      className="w-full py-1 px-2 text-sm rounded border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tümü</option>
                      <option value="Eksik">Eksik</option>
                      <option value="Onay">Onay</option>
                    </select>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
              {displayNotes.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      6 +
                      tabDisplayFields.length +
                      (tabDisplayFields.some((f) => f.id === 'date') ? 0 : 1) +
                      (activeTab === 'tebligat' || activeTab === 'kentsel' ? 1 : 0)
                    }
                    className="px-4 py-8 text-center whitespace-normal text-gray-500 bg-white"
                  >
                    Henüz not bulunmuyor
                  </td>
                </tr>
              ) : (
                displayNotes.map((note, idx) => {
                  const status = normalizeStatus(note.status);
                  const isEditingProject = editingCell?.id === note.id && editingCell?.field === 'projectName';
                  const isEditingStatus = editingCell?.id === note.id && editingCell?.field === 'status';
                  return (
                    <tr
                      key={note.id}
                      className="group border-t border-gray-200 bg-white hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] px-4 py-2 font-mono whitespace-nowrap text-gray-600 border-r border-gray-200">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200 bg-white group-hover:bg-blue-50/50 whitespace-nowrap min-w-[200px]">
                        {isEditingProject && canEditInline && canEditNote(note) ? (
                          <input
                            ref={editInputRef as React.RefObject<HTMLInputElement>}
                            type="text"
                            value={editingCell?.value ?? note.projectName ?? ''}
                            onChange={(e) => setEditingCell((c) => (c ? { ...c, value: e.target.value } : null))}
                            onBlur={() => handleCellSave(note.id, 'projectName', editingCell?.value ?? '')}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(note.id, 'projectName', editingCell?.value ?? ''); }}
                            className="w-full min-w-0 py-0.5 px-1.5 text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-900"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setSelectedNote(note); setIsDetailModalOpen(true); }}
                            onDoubleClick={(e) => { e.preventDefault(); handleCellEdit(note, 'projectName', note.projectName || ''); }}
                            className={`text-left w-full text-blue-600 hover:text-blue-500 hover:underline focus:outline-none truncate block ${canEditInline ? 'cursor-pointer' : 'cursor-default'}`}
                          >
                            {note.projectName || '-'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 border-r border-gray-200 text-gray-700 whitespace-nowrap min-w-[120px]">
                        {note.userName || note.userEmail || '-'}
                      </td>
                      {tabDisplayFields.map((f) => {
                        const val = getNoteFieldValue(note, f.id);
                        let display = '-';
                        let rawVal = '';
                        if (val !== undefined && val !== null) {
                          if ((f.type === 'date' || f.id === 'date') && val) {
                            const dateStr = f.id === 'date' ? (getWorkDate(note) || String(val)) : String(val);
                            display = formatWorkDate(dateStr);
                            rawVal = dateStr;
                          } else if (Array.isArray(val)) {
                            display = val.length > 0 ? val.join(', ') : '-';
                            rawVal = val.join(', ');
                          } else if (typeof val === 'boolean' || val === 'true' || val === 'false') {
                            const boolVal = val === true || val === 'true';
                            display = boolVal ? 'Evet' : '-';
                            rawVal = boolVal ? 'true' : 'false';
                          } else if (val !== '') {
                            display = String(val);
                            rawVal = String(val);
                          }
                        }
                        const isEditing = editingCell?.id === note.id && editingCell?.field === f.id;
                        const options = (f.type === 'select' || f.type === 'multiselect') ? (f.options ?? (f.id === 'category' ? CATEGORY_OPTIONS : [])) : [];
                        const useSelect = (f.id === 'category' || f.type === 'select') && options.length > 0;
                        const useDate = f.type === 'date' || f.id === 'date';
                        const useCheckbox = f.type === 'checkbox';
                        return (
                          <td
                            key={f.id}
                            className={`px-4 py-2 border-r border-gray-200 whitespace-nowrap min-w-[100px] ${['ada', 'parsel'].includes(f.id) ? 'font-mono' : ''} ${isEditing && canEditInline && canEditNote(note) ? 'p-0' : 'text-gray-700'} ${canEditInline ? 'cursor-pointer' : ''}`}
                            onDoubleClick={() => handleCellEdit(note, f.id, rawVal)}
                          >
                            {isEditing && canEditInline && canEditNote(note) ? (
                              useCheckbox ? (
                                <input
                                  ref={editInputRef as React.RefObject<HTMLInputElement>}
                                  type="checkbox"
                                  checked={editingCell?.value === 'true'}
                                  onChange={(e) => {
                                    setEditingCell((c) => (c ? { ...c, value: e.target.checked ? 'true' : 'false' } : null));
                                    handleCellSave(note.id, f.id, e.target.checked ? 'true' : 'false');
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : useSelect ? (
                                <select
                                  ref={editInputRef as React.RefObject<HTMLSelectElement>}
                                  value={editingCell?.value ?? rawVal}
                                  onChange={(e) => setEditingCell((c) => (c ? { ...c, value: e.target.value } : null))}
                                  onBlur={() => handleCellSave(note.id, f.id, editingCell?.value ?? '')}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(note.id, f.id, editingCell?.value ?? ''); }}
                                  className="w-full min-w-0 py-0.5 px-1.5 text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-900 appearance-none"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">Seçiniz</option>
                                  {(options || []).map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : useDate ? (
                                <input
                                  ref={editInputRef as React.RefObject<HTMLInputElement>}
                                  type="date"
                                  value={editingCell?.value ?? rawVal}
                                  onChange={(e) => setEditingCell((c) => (c ? { ...c, value: e.target.value } : null))}
                                  onBlur={() => handleCellSave(note.id, f.id, editingCell?.value ?? '')}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(note.id, f.id, editingCell?.value ?? ''); }}
                                  className="w-full min-w-0 py-0.5 px-1.5 text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-900"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <input
                                  ref={editInputRef as React.RefObject<HTMLInputElement>}
                                  type="text"
                                  value={editingCell?.value ?? rawVal}
                                  onChange={(e) => setEditingCell((c) => (c ? { ...c, value: e.target.value } : null))}
                                  onBlur={() => handleCellSave(note.id, f.id, editingCell?.value ?? '')}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(note.id, f.id, editingCell?.value ?? ''); }}
                                  className="w-full min-w-0 py-0.5 px-1.5 text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-900"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              )
                            ) : (
                              <span className="block truncate">{display}</span>
                            )}
                          </td>
                        );
                      })}
                      {!tabDisplayFields.some((f) => f.id === 'date') && (
                        <td className="px-4 py-2 border-r border-gray-200 font-mono whitespace-nowrap text-gray-700 min-w-[110px]">
                          {formatWorkDate(getWorkDate(note))}
                        </td>
                      )}
                      {(activeTab === 'tebligat' || activeTab === 'kentsel') && (
                        <td className="px-4 py-2 border-r border-gray-200 whitespace-nowrap min-w-[130px]">
                          {renderDeadlineWarning(note)}
                        </td>
                      )}
                      <td className="px-4 py-2 border-r border-gray-200 whitespace-nowrap min-w-[90px]">
                        {isEditingStatus && canEditInline && canEditNote(note) ? (
                          <select
                            ref={editInputRef as React.RefObject<HTMLSelectElement>}
                            value={editingCell?.value ?? status}
                            onChange={(e) => setEditingCell((c) => (c ? { ...c, value: e.target.value } : null))}
                            onBlur={() => handleCellSave(note.id, 'status', editingCell?.value ?? status)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCellSave(note.id, 'status', editingCell?.value ?? status); }}
                            className="w-full py-0.5 px-1.5 text-sm bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded text-gray-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="Eksik">Eksik</option>
                            <option value="Onay">Onay</option>
                          </select>
                        ) : (
                          <span
                            onDoubleClick={() => handleCellEdit(note, 'status', status)}
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${canEditInline ? 'cursor-pointer' : 'cursor-default'} ${
                              status === 'Onay' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {NOTE_STATUS_CONFIG[status]?.label || 'Eksik'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-600 bg-white group-hover:bg-blue-50/50 min-w-[100px]">
                        <div className="flex items-center gap-1">
                          {canEditNote(note) && (
                            <button
                              onClick={() => handleEditNote(note)}
                              className="p-1.5 rounded transition-colors hover:bg-gray-200 text-gray-600"
                              title="Düzenle"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteNote(note) && (
                            <button
                              onClick={() => handleDeleteNote(note)}
                              className="p-1.5 rounded transition-colors hover:bg-red-100 text-red-600"
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
      <NoteDetailModal
        note={selectedNote}
        isOpen={isDetailModalOpen}
        onClose={() => { setSelectedNote(null); setIsDetailModalOpen(false); }}
        onAddComment={addComment}
        onDeleteComment={deleteComment}
        onEdit={handleEditNote}
        canEdit={selectedNote ? canEditNote(selectedNote) : false}
      />
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
