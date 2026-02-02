import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { NoteFormData, Note } from '../types';

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => Promise<void>;
  editNote?: Note | null;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editNote
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectName, setProjectName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Populate form when editing
  useEffect(() => {
    if (editNote) {
      setTitle(editNote.title);
      setContent(editNote.content);
      setProjectName(editNote.projectName);
      if (editNote.imageUrl) {
        setImagePreview(editNote.imageUrl);
      }
    } else {
      resetForm();
    }
  }, [editNote, isOpen]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setProjectName('');
    setImageFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!projectName.trim()) {
      setError('Please enter a project name');
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        projectName: projectName.trim(),
        image: imageFile
      });
      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !submitting) {
      onClose();
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-850 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700/50 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <h2 className="text-xl font-semibold text-white">
            {editNote ? 'Edit Note' : 'Add Field Note'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 text-concrete-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 space-y-5">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Image Upload Section */}
            <div>
              <label className="block text-concrete-300 text-sm font-medium mb-2">
                Photo
              </label>

              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden bg-slate-800">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 left-2 p-1.5 bg-red-500/90 hover:bg-red-500 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Camera Button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-600 hover:border-safety-orange rounded-xl transition-colors group"
                  >
                    <Camera className="w-8 h-8 text-concrete-400 group-hover:text-safety-orange mb-2 transition-colors" />
                    <span className="text-concrete-400 group-hover:text-concrete-200 text-sm font-medium transition-colors">
                      Take Photo
                    </span>
                  </button>
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-600 hover:border-safety-orange rounded-xl transition-colors group"
                  >
                    <Upload className="w-8 h-8 text-concrete-400 group-hover:text-safety-orange mb-2 transition-colors" />
                    <span className="text-concrete-400 group-hover:text-concrete-200 text-sm font-medium transition-colors">
                      Upload Image
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Image Info */}
              <p className="text-concrete-500 text-xs mt-2 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Take or upload a photo of the site issue
              </p>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-concrete-300 text-sm font-medium mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Concrete crack on Level 3"
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-4 text-white placeholder-concrete-500 focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                required
              />
            </div>

            {/* Project Name Input */}
            <div>
              <label className="block text-concrete-300 text-sm font-medium mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Building A - Foundation Work"
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-4 text-white placeholder-concrete-500 focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all"
                required
              />
            </div>

            {/* Description/Content Textarea */}
            <div>
              <label className="block text-concrete-300 text-sm font-medium mb-2">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe the issue, location, or any relevant details..."
                rows={5}
                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-4 text-white placeholder-concrete-500 focus:outline-none focus:border-safety-orange focus:ring-2 focus:ring-safety-orange/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 p-4 border-t border-slate-700/50 bg-slate-900/30">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-6 py-4 border border-slate-600 text-concrete-300 hover:text-white hover:bg-slate-700/50 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-safety-orange to-safety-orange-dark hover:from-safety-orange-dark hover:to-safety-orange text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                editNote ? 'Update Note' : 'Save Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
