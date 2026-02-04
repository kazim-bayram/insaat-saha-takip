import React from 'react';
import { 
  Calendar, 
  FolderOpen, 
  User, 
  Trash2, 
  Edit3,
  ImageIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Note } from '../types';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showWorkerInfo?: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  onClick, 
  onEdit, 
  onDelete,
  showWorkerInfo = false 
}) => {
  const { isDark } = useTheme();
  
  const formattedDate = note.createdAt.toDate().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = note.createdAt.toDate().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

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

  return (
    <div
      onClick={onClick}
      className={`group rounded-xl border overflow-hidden cursor-pointer card-hover ${
        isDark 
          ? 'bg-slate-850 border-slate-700/50' 
          : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      {/* Resim Bölümü */}
      {note.imageUrl ? (
        <div className={`relative aspect-video overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
          <img
            src={note.imageUrl}
            alt={note.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className={`aspect-video flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
          <ImageIcon className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
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

        {/* İçerik Önizleme */}
        <p className={`text-sm line-clamp-3 mb-3 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
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
