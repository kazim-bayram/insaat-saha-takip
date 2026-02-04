import React from 'react';
import {
  X,
  Calendar,
  FolderOpen,
  User,
  Mail,
  Download,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Note } from '../types';

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, isOpen, onClose }) => {
  const { isDark } = useTheme();
  
  if (!isOpen || !note) return null;

  const formattedDate = note.createdAt.toDate().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = note.createdAt.toDate().toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleDownloadImage = () => {
    if (note.imageUrl) {
      window.open(note.imageUrl, '_blank');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        {/* Başlık */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold truncate pr-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {note.title || 'Başlıksız Not'}
          </h2>
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

        {/* İçerik */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Resim Bölümü */}
            <div className="space-y-4">
              {note.imageUrl ? (
                <div className={`relative rounded-xl overflow-hidden group ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <img
                    src={note.imageUrl}
                    alt={note.title}
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  {/* Resim Aksiyonları */}
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleDownloadImage}
                      className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg transition-colors"
                      title="Yeni sekmede aç"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <a
                      href={note.imageUrl}
                      download
                      className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg transition-colors"
                      title="Resmi indir"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className={`aspect-video rounded-xl flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <div className={`text-center ${isDark ? 'text-concrete-500' : 'text-gray-400'}`}>
                    <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                    <p>Resim eklenmemiş</p>
                  </div>
                </div>
              )}
            </div>

            {/* Detay Bölümü */}
            <div className="space-y-6">
              {/* Proje */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-safety-orange/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-safety-orange" />
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>Proje</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {note.projectName || 'Belirtilmemiş'}
                  </p>
                </div>
              </div>

              {/* Gönderen */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-steel-600/10' : 'bg-blue-50'}`}>
                  <User className={`w-5 h-5 ${isDark ? 'text-steel-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>Gönderen</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{note.userName}</p>
                  <p className={`text-sm flex items-center gap-1 mt-0.5 ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>
                    <Mail className="w-3.5 h-3.5" />
                    {note.userEmail}
                  </p>
                </div>
              </div>

              {/* Tarih */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-steel-600/10' : 'bg-blue-50'}`}>
                  <Calendar className={`w-5 h-5 ${isDark ? 'text-steel-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>Tarih ve Saat</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{formattedDate}</p>
                  <p className={`text-sm ${isDark ? 'text-concrete-400' : 'text-gray-500'}`}>{formattedTime}</p>
                </div>
              </div>

              {/* Açıklama/İçerik */}
              <div className={`pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                  Açıklama
                </h3>
                <div className={`rounded-xl p-4 max-h-[200px] overflow-y-auto ${
                  isDark ? 'bg-slate-900/50' : 'bg-gray-50'
                }`}>
                  <p className={`whitespace-pre-wrap text-sm leading-relaxed ${
                    isDark ? 'text-concrete-200' : 'text-gray-700'
                  }`}>
                    {note.content || 'Açıklama girilmemiş'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetailModal;
