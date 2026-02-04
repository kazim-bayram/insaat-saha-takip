import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
  MapPin,
  Layers
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { NoteFormData, Note, CustomField, UploadProgress, getNoteImages } from '../types';

interface ImagePreview {
  file: File;
  previewUrl: string;
}

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NoteFormData) => Promise<void>;
  editNote?: Note | null;
  uploadProgress?: UploadProgress | null;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editNote,
  uploadProgress
}) => {
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectName, setProjectName] = useState('');
  const [ada, setAda] = useState('');
  const [parsel, setParsel] = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  // Multi-image state
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // For edit mode
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
      setAda(editNote.ada || '');
      setParsel(editNote.parsel || '');
      setCustomFields(editNote.customFields || []);
      // Load existing images with backward compatibility
      const images = getNoteImages(editNote);
      setExistingImages(images);
    } else {
      resetForm();
    }
  }, [editNote, isOpen]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setProjectName('');
    setAda('');
    setParsel('');
    setCustomFields([]);
    // Clean up preview URLs
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview.previewUrl));
    setImagePreviews([]);
    setExistingImages([]);
    setError(null);
  };

  // Custom field handlers
  const addCustomField = () => {
    setCustomFields([...customFields, { label: '', value: '' }]);
  };

  const updateCustomField = (index: number, field: 'label' | 'value', newValue: string) => {
    const updated = [...customFields];
    updated[index][field] = newValue;
    setCustomFields(updated);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  // Handle multiple image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: ImagePreview[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      // Dosya türü kontrolü
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Geçersiz dosya türü`);
        return;
      }

      // Dosya boyutu kontrolü (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: 10MB'dan büyük`);
        return;
      }

      // Check total limit (max 10 images)
      if (imagePreviews.length + existingImages.length + newPreviews.length >= 10) {
        errors.push('En fazla 10 resim yüklenebilir');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newPreviews.push({ file, previewUrl });
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError(null);
    }

    if (newPreviews.length > 0) {
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }

    // Reset input
    e.target.value = '';
  };

  // Remove a new image preview
  const removeImagePreview = (index: number) => {
    setImagePreviews(prev => {
      const toRemove = prev[index];
      URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Remove an existing image (edit mode)
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
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
      // Filter out empty custom fields
      const filteredCustomFields = customFields.filter(
        field => field.label.trim() && field.value.trim()
      );

      // Get files array from previews
      const imageFiles = imagePreviews.map(preview => preview.file);

      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        projectName: projectName.trim(),
        ada: ada.trim(),
        parsel: parsel.trim(),
        customFields: filteredCustomFields,
        images: imageFiles
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

  const clearAllImages = () => {
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview.previewUrl));
    setImagePreviews([]);
    setExistingImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const totalImages = imagePreviews.length + existingImages.length;

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
              <div className="flex items-center justify-between mb-2">
                <label className={`block text-sm font-medium ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Fotoğraflar {totalImages > 0 && `(${totalImages}/10)`}
                  </span>
                </label>
                {totalImages > 0 && (
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Tümünü Temizle
                  </button>
                )}
              </div>

              {/* Upload Progress Indicator */}
              {uploadProgress && (
                <div className={`mb-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-blue-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      Yükleniyor {uploadProgress.current}/{uploadProgress.total}...
                    </span>
                    <span className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      %{uploadProgress.percentage}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-blue-200'}`}>
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Image Grid Preview */}
              {totalImages > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {/* Existing images (edit mode) */}
                  {existingImages.map((url, index) => (
                    <div 
                      key={`existing-${index}`} 
                      className={`relative aspect-square rounded-lg overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}
                    >
                      <img
                        src={url}
                        alt={`Mevcut ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-500 rounded-md transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                      <div className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isDark ? 'bg-slate-900/80 text-concrete-300' : 'bg-white/80 text-gray-600'
                      }`}>
                        Mevcut
                      </div>
                    </div>
                  ))}
                  
                  {/* New image previews */}
                  {imagePreviews.map((preview, index) => (
                    <div 
                      key={`new-${index}`} 
                      className={`relative aspect-square rounded-lg overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}
                    >
                      <img
                        src={preview.previewUrl}
                        alt={`Yeni ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImagePreview(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500/90 hover:bg-red-500 rounded-md transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Add more button (if under limit) */}
                  {totalImages < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                        isDark 
                          ? 'border-slate-600 hover:border-safety-orange text-concrete-400 hover:text-safety-orange' 
                          : 'border-gray-300 hover:border-safety-orange text-gray-400 hover:text-safety-orange'
                      }`}
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-[10px] mt-1">Ekle</span>
                    </button>
                  )}
                </div>
              )}

              {/* Upload Buttons (when no images) */}
              {totalImages === 0 && (
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
                    <span className={`text-sm font-medium transition-colors group-hover:text-safety-orange ${
                      isDark ? 'text-concrete-400' : 'text-gray-500'
                    }`}>
                      Fotoğraf Çek
                    </span>
                  </button>

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
                    <span className={`text-sm font-medium transition-colors group-hover:text-safety-orange ${
                      isDark ? 'text-concrete-400' : 'text-gray-500'
                    }`}>
                      Resim Yükle
                    </span>
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Resim Bilgisi */}
              <p className={`text-xs mt-2 flex items-center gap-1 ${isDark ? 'text-concrete-500' : 'text-gray-500'}`}>
                <ImageIcon className="w-3.5 h-3.5" />
                Birden fazla fotoğraf seçebilirsiniz (max 10, her biri max 10MB)
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

            {/* Ada/Parsel Bilgileri */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Arazi Bilgileri
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={ada}
                    onChange={(e) => setAda(e.target.value)}
                    placeholder="Ada (Örn: 123)"
                    className={`w-full rounded-xl px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={parsel}
                    onChange={(e) => setParsel(e.target.value)}
                    placeholder="Parsel (Örn: 5)"
                    className={`w-full rounded-xl px-4 py-3 transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                      isDark 
                        ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Dinamik Özel Alanlar */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-concrete-300' : 'text-gray-700'}`}>
                Özel Alanlar
              </label>
              
              {/* Mevcut özel alanlar */}
              {customFields.length > 0 && (
                <div className="space-y-2 mb-3">
                  {customFields.map((field, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                        placeholder="Etiket (Örn: Beton Sınıfı)"
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                          isDark 
                            ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                            : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                        }`}
                      />
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        placeholder="Değer (Örn: C30)"
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-safety-orange/20 ${
                          isDark 
                            ? 'bg-slate-900/50 border border-slate-600 text-white placeholder-concrete-500 focus:border-safety-orange' 
                            : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-safety-orange'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Alan Ekle Butonu */}
              <button
                type="button"
                onClick={addCustomField}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isDark 
                    ? 'bg-slate-800 text-concrete-300 hover:text-white hover:bg-slate-700 border border-slate-600' 
                    : 'bg-gray-100 text-gray-600 hover:text-gray-800 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <Plus className="w-4 h-4" />
                + Alan Ekle
              </button>
              <p className={`text-xs mt-2 ${isDark ? 'text-concrete-500' : 'text-gray-500'}`}>
                Beton sınıfı, kat sayısı gibi ek bilgiler ekleyebilirsiniz
              </p>
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
