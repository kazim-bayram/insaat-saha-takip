import React from 'react';
import { 
  Calendar, 
  FolderOpen, 
  User, 
  Trash2, 
  Edit3,
  ImageIcon
} from 'lucide-react';
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
  const formattedDate = note.createdAt.toDate().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = note.createdAt.toDate().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDelete?.();
    }
  };

  return (
    <div
      onClick={onClick}
      className="group bg-slate-850 rounded-xl border border-slate-700/50 overflow-hidden cursor-pointer card-hover"
    >
      {/* Image Section */}
      {note.imageUrl ? (
        <div className="relative aspect-video overflow-hidden bg-slate-800">
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
        <div className="aspect-video bg-slate-800 flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-slate-600" />
        </div>
      )}

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1 group-hover:text-safety-orange transition-colors">
          {note.title || 'Untitled Note'}
        </h3>

        {/* Content Preview */}
        <p className="text-concrete-400 text-sm line-clamp-3 mb-3">
          {note.content || 'No description provided'}
        </p>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-concrete-500">
          {/* Project Name */}
          <div className="flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{note.projectName || 'No Project'}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
            <span className="text-concrete-600">•</span>
            <span>{formattedTime}</span>
          </div>

          {/* Worker Info (Admin View) */}
          {showWorkerInfo && (
            <div className="flex items-center gap-1.5 w-full mt-1">
              <User className="w-3.5 h-3.5" />
              <span className="truncate">{note.userName || note.userEmail}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-steel-300 hover:text-white hover:bg-steel-700/50 rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCard;
