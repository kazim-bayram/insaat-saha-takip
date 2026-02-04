import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  FolderOpen, 
  User, 
  Trash2, 
  Edit3,
  ImageIcon,
  MapPin,
  ChevronDown,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Note, NoteStatus, NOTE_STATUS_CONFIG, getNoteImages } from '../types';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (noteId: string, newStatus: NoteStatus) => Promise<void>;
  showWorkerInfo?: boolean;
  isAdmin?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onClick, 
  onEdit, 
  onDelete,
  onStatusChange,
  showWorkerInfo = false,
  isAdmin = false
}) => {
  const { isDark } = useTheme();
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const formattedDate = note.createdAt.toDate().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = note.createdAt.toDate().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Current status config
  const currentStatus = note.status || 'open';
  const statusConfig = NOTE_STATUS_CONFIG[currentStatus];

  // Get images array with backward compatibility
  const images = getNoteImages(note);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Bu notu silmek istediğinizden emin misiniz?')) {
      onDelete?.();
    }
  };

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAdmin && onStatusChange) {
      setShowStatusDropdown(!showStatusDropdown);
    }
  };

  const handleStatusChange = async (e: React.MouseEvent, newStatus: NoteStatus) => {
    e.stopPropagation();
    if (!onStatusChange || newStatus === currentStatus) {
      setShowStatusDropdown(false);
      return;
    }

    setUpdatingStatus(true);
    try {
      await onStatusChange(note.id, newStatus);
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingStatus(false);
      setShowStatusDropdown(false);
    }
  };

  // Get status icon
  const getStatusIcon = (status: NoteStatus) => {
    switch (status) {
      case 'open':
        return <Clock className="w-3.5 h-3.5" />;
      case 'in_progress':
        return <Loader2 className="w-3.5 h-3.5" />;
      case 'resolved':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5" />;
    }
  };

  // Border color based on status
  const getBorderClass = () => {
    if (isDark) {
      switch (currentStatus) {
        case 'in_progress': return 'border-blue-600/50';
        case 'resolved': return 'border-green-600/50';
        case 'rejected': return 'border-red-600/50';
        default: return 'border-slate-700/50';
      }
    } else {
      switch (currentStatus) {
        case 'in_progress': return 'border-blue-300';
        case 'resolved': return 'border-green-300';
        case 'rejected': return 'border-red-300';
        default: return 'border-gray-200';
      }
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl border-2 overflow-hidden cursor-pointer card-hover ${
        isDark 
          ? `bg-slate-850 ${getBorderClass()}` 
          : `bg-white ${getBorderClass()} shadow-sm`
      }`}
    >
      {/* Resim Bölümü */}
      {images.length > 0 ? (
        <div className={`relative overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
          {/* Single Image - Full Width */}
          {images.length === 1 && (
            <div className="aspect-video">
              <img
                src={images[0]}
                alt={note.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          )}
          
          {/* 2 Images - Side by Side */}
          {images.length === 2 && (
            <div className="aspect-video grid grid-cols-2 gap-0.5">
              {images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`${note.title} ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ))}
            </div>
          )}
          
          {/* 3+ Images - Grid Layout */}
          {images.length >= 3 && (
            <div className="aspect-video grid grid-cols-2 grid-rows-2 gap-0.5">
              <img
                src={images[0]}
                alt={`${note.title} 1`}
                className="w-full h-full object-cover row-span-2 transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <img
                src={images[1]}
                alt={`${note.title} 2`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="relative">
                <img
                  src={images[2]}
                  alt={`${note.title} 3`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {images.length > 3 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">+{images.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          {/* Image Count Badge (if multiple) */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-full text-white text-xs">
              <Layers className="w-3 h-3" />
              {images.length}
            </div>
          )}
          
          {/* Status Badge on Image */}
          <div className="absolute top-2 right-2">
            <div 
              ref={dropdownRef}
              className="relative"
              onClick={handleStatusClick}
            >
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isDark 
                    ? `${statusConfig.bgDark} ${statusConfig.textDark}` 
                    : `${statusConfig.bgLight} ${statusConfig.textLight}`
                } ${isAdmin && onStatusChange ? 'cursor-pointer hover:opacity-80' : ''}`}
              >
                {updatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  getStatusIcon(currentStatus)
                )}
                {statusConfig.label}
                {isAdmin && onStatusChange && <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>
              
              {/* Status Dropdown */}
              {showStatusDropdown && isAdmin && (
                <div className={`absolute top-full right-0 mt-1 py-1 rounded-lg shadow-lg border z-50 min-w-[140px] ${
                  isDark 
                    ? 'bg-slate-800 border-slate-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  {Object.values(NOTE_STATUS_CONFIG).map((config) => (
                    <button
                      key={config.key}
                      onClick={(e) => handleStatusChange(e, config.key)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                        currentStatus === config.key 
                          ? isDark ? 'bg-slate-700' : 'bg-gray-100'
                          : isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                      } ${isDark ? config.textDark : config.textLight}`}
                    >
                      {getStatusIcon(config.key)}
                      {config.label}
                      {currentStatus === config.key && (
                        <CheckCircle2 className="w-3 h-3 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={`aspect-video flex items-center justify-center relative ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
          <ImageIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
          
          {/* Status Badge when no Image */}
          <div className="absolute top-2 right-2">
            <div 
              ref={dropdownRef}
              className="relative"
              onClick={handleStatusClick}
            >
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  isDark 
                    ? `${statusConfig.bgDark} ${statusConfig.textDark}` 
                    : `${statusConfig.bgLight} ${statusConfig.textLight}`
                } ${isAdmin && onStatusChange ? 'cursor-pointer hover:opacity-80' : ''}`}
              >
                {updatingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  getStatusIcon(currentStatus)
                )}
                {statusConfig.label}
                {isAdmin && onStatusChange && <ChevronDown className="w-3 h-3 ml-0.5" />}
              </button>
              
              {/* Status Dropdown */}
              {showStatusDropdown && isAdmin && (
                <div className={`absolute top-full right-0 mt-1 py-1 rounded-lg shadow-lg border z-50 min-w-[140px] ${
                  isDark 
                    ? 'bg-slate-800 border-slate-600' 
                    : 'bg-white border-gray-200'
                }`}>
                  {Object.values(NOTE_STATUS_CONFIG).map((config) => (
                    <button
                      key={config.key}
                      onClick={(e) => handleStatusChange(e, config.key)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                        currentStatus === config.key 
                          ? isDark ? 'bg-slate-700' : 'bg-gray-100'
                          : isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'
                      } ${isDark ? config.textDark : config.textLight}`}
                    >
                      {getStatusIcon(config.key)}
                      {config.label}
                      {currentStatus === config.key && (
                        <CheckCircle2 className="w-3 h-3 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* İçerik Bölümü */}
      <div className="p-4">
        {/* Başlık */}
        <h3 className={`font-semibold text-lg mb-2 line-clamp-1 group-hover:text-safety-orange transition-colors ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {note.title || 'Başlıksız Not'}
        </h3>

        {/* Ada/Parsel Bilgileri */}
        {(note.ada || note.parsel) && (
          <div className={`flex items-center gap-2 mb-2 flex-wrap`}>
            <MapPin className={`w-3.5 h-3.5 ${isDark ? 'text-safety-orange' : 'text-orange-500'}`} />
            {note.ada && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isDark 
                  ? 'bg-safety-orange/20 text-safety-orange' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                Ada: {note.ada}
              </span>
            )}
            {note.parsel && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isDark 
                  ? 'bg-steel-600/20 text-steel-300' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                Parsel: {note.parsel}
              </span>
            )}
          </div>
        )}

        {/* Özel Alanlar */}
        {note.customFields && note.customFields.length > 0 && (
          <div className={`mb-3 p-2 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {note.customFields.slice(0, 3).map((field, index) => (
                <div key={index} className={`text-xs ${isDark ? 'text-concrete-400' : 'text-gray-600'}`}>
                  <span className={`font-medium ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                    {field.label}:
                  </span>{' '}
                  {field.value}
                </div>
              ))}
              {note.customFields.length > 3 && (
                <span className={`text-xs ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
                  +{note.customFields.length - 3} daha
                </span>
              )}
            </div>
          </div>
        )}

        {/* İçerik Önizleme */}
        <p className={`text-sm line-clamp-2 mb-3 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
          {note.content || 'Açıklama girilmemiş'}
        </p>

        {/* Meta Bilgiler */}
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${isDark ? 'text-concrete-500' : 'text-gray-500'}`}>
          {/* Proje Adı */}
          <div className="flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{note.projectName || 'Proje Yok'}</span>
          </div>

          {/* Tarih */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
            <span className={isDark ? 'text-concrete-600' : 'text-gray-400'}>•</span>
            <span>{formattedTime}</span>
          </div>

          {/* Çalışan Bilgisi (Yönetici Görünümü) */}
          {showWorkerInfo && (
            <div className="flex items-center gap-1.5 w-full mt-1">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">{note.userName || note.userEmail}</span>
            </div>
          )}
        </div>

        {/* Aksiyon Butonları */}
        {(onEdit || onDelete) && (
          <div className={`flex items-center gap-2 mt-4 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'border-slate-700/50' : 'border-gray-200'
          }`}>
            {onEdit && (
              <button
                onClick={handleEdit}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isDark 
                    ? 'text-steel-300 hover:text-white hover:bg-steel-700/50' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Düzenle
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sil
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCard;
