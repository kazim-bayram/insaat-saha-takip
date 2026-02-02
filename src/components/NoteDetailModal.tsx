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
import { Note } from '../types';

interface NoteDetailModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
}

const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, isOpen, onClose }) => {
  if (!isOpen || !note) return null;

  const formattedDate = note.createdAt.toDate().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = note.createdAt.toDate().toLocaleTimeString('en-US', {
    hour: 'numeric',
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
      <div className="bg-slate-850 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700/50 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white truncate pr-4">
            {note.title || 'Untitled Note'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-concrete-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Image Section */}
            <div className="space-y-4">
              {note.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden bg-slate-800 group">
                  <img
                    src={note.imageUrl}
                    alt={note.title}
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                  {/* Image Actions */}
                  <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleDownloadImage}
                      className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <a
                      href={note.imageUrl}
                      download
                      className="p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg transition-colors"
                      title="Download image"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-slate-800 rounded-xl flex items-center justify-center">
                  <div className="text-center text-concrete-500">
                    <ImageIcon className="w-16 h-16 mx-auto mb-2" />
                    <p>No image attached</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Project */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-safety-orange/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-safety-orange" />
                </div>
                <div>
                  <p className="text-concrete-400 text-sm">Project</p>
                  <p className="text-white font-medium">{note.projectName || 'Not specified'}</p>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-steel-600/10 rounded-lg">
                  <User className="w-5 h-5 text-steel-400" />
                </div>
                <div>
                  <p className="text-concrete-400 text-sm">Submitted by</p>
                  <p className="text-white font-medium">{note.userName}</p>
                  <p className="text-concrete-400 text-sm flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    {note.userEmail}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-steel-600/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-steel-400" />
                </div>
                <div>
                  <p className="text-concrete-400 text-sm">Date & Time</p>
                  <p className="text-white font-medium">{formattedDate}</p>
                  <p className="text-concrete-400 text-sm">{formattedTime}</p>
                </div>
              </div>

              {/* Description/Content */}
              <div className="pt-4 border-t border-slate-700/50">
                <h3 className="text-concrete-300 text-sm font-medium mb-3">Description</h3>
                <div className="bg-slate-900/50 rounded-xl p-4 max-h-[200px] overflow-y-auto">
                  <p className="text-concrete-200 whitespace-pre-wrap text-sm leading-relaxed">
                    {note.content || 'No description provided'}
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
