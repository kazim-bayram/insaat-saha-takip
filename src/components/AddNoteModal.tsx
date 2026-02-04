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
import { useTheme } from '../contexts/ThemeContext';
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
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectName, setProjectName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Düzenleme modunda formu doldur
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

    // Dosya türü kontrolü
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir resim dosyası seçin');
      return;
    }

    // Dosya boyutu kontrolü (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Resim 10MB\'dan küçük olmalıdır');
      return;
    }

    setImageFile(file);
    setError(null);

    // Önizleme oluştur
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Doğrulama
    if (!title.trim()) {
      setError('Lütfen bir başlık girin');
      return;
    }

    if (!projectName.trim()) {
      setError('Lütfen bir proje adı girin');
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
      setError(err instanceof Error ? err.message : 'Not kaydedilemedi');
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
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border animate-slide-up ${
        isDark 
          ? 'bg-slate-850 border-slate-700/50' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Başlık */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-slate-700/50' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {editNote ? 'Notu Düzenle' : 'Saha Notu Ekle'}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              isDark 
                ? 'text-concrete-400 hover:text-white hover:bg-slate-700/50' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-4 space-y-5">
            {/* Hata Mesajı */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Resim Yükleme Bölümü */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                Fotoğraf
              </label>

              {imagePreview ? (
                <div className={`relative rounded-xl overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                  <img
                    src={imagePreview}
                    alt="Önizleme"
                    className="w-full h-48 object-cover"
                  />

                  {/* Kaldır Butonu */}
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
                  {/* Kamera Butonu */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors group ${
                      isDark 
                        ? 'border-slate-600 hover:border-safety-orange' 
                        : 'border-gray-300 hover:border-safety-orange'
                    }`}
                  >
                    <Camera className={`w-8 h-8 mb-2 transition-colors group-hover:text-safety-orange ${
                      isDark ? 'text-concrete-400' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium transition-colors group-hover:text-gray-200 ${
                      isDark ? 'text-concrete-400' : 'text-gray-500'
                    }`}>
                      Fotoğraf Çek
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

                  {/* Yükle Butonu */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors group ${
                      isDark 
                        ? 'border-slate-600 hover:border-safety-orange' 
                        : 'border-gray-300 hover:border-safety-orange'
                    }`}
                  >
                    <Upload className={`w-8 h-8 mb-2 transition-colors group-hover:text-safety-orange ${
                      isDark ? 'text-concrete-400' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm font-medium transition-colors group-hover:text-gray-200 ${
                      isDark ? 'text-concrete-400' : 'text-gray-500'
                    }`}>
                      Resim Yükle
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

              {/* Resim Bilgisi */}
              <p className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-concrete-500' : 'text-gray-500'}`}>
                <ImageIcon className="w-3.5 h-3.5" />
                Saha sorununun fotoğrafını çekin veya yükleyin
              </p>
            </div>

            {/* Başlık Girişi */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                Başlık *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: 3. Katta beton çatlağı"
                className={`w-full rounded-xl px-4 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                  isDark 
                    ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                }`}
                required
              />
            </div>

            {/* Proje Adı Girişi */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                Proje Adı *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Örn: A Blok - Temel İşleri"
                className={`w-full rounded-xl px-4 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                  isDark 
                    ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                }`}
                required
              />
            </div>

            {/* Açıklama/İçerik Alanı */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Açıklama
                </span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Sorunu, konumu veya ilgili detayları açıklayın..."
                rows={5}
                className={`w-full rounded-xl px-4 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 resize-none ${
                  isDark 
                    ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                }`}
              />
            </div>
          </div>

          {/* Alt Aksiyonlar */}
          <div className={`flex gap-3 p-4 border-t ${
            isDark ? 'border-slate-700/50 bg-slate-900/30' : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`flex-1 px-6 py-4 border rounded-xl font-medium transition-colors disabled:opacity-50 ${
                isDark 
                  ? 'border-slate-600 text-concrete-300 hover:text-white hover:bg-slate-700/50' 
                  : 'border-gray-300 text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-safety-orange to-safety-orange-dark hover:from-safety-orange-dark hover:to-safety-orange text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                editNote ? 'Notu Güncelle' : 'Notu Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
