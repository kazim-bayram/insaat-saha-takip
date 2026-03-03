export async function processImageBeforeUpload(file: File): Promise<File> {
  const contentType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();

  const isHeicMime = contentType === 'image/heic' || contentType === 'image/heif';
  const isHeicExtension = fileName.endsWith('.heic') || fileName.endsWith('.heif');

  if (!isHeicMime && !isHeicExtension) {
    return file;
  }

  try {
    const heic2anyModule = await import('heic2any');
    const heic2any = (heic2anyModule as typeof import('heic2any')).default;

    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.8
    });

    const blob = Array.isArray(converted) ? converted[0] : converted;
    const jpegFileName = file.name.replace(/\.[^/.]+$/i, '.jpg');

    const jpegFile = new File([blob], jpegFileName, { type: 'image/jpeg' });
    return jpegFile;
  } catch (error) {
    // If conversion fails for any reason, surface a clear error to the caller
    console.error('HEIC to JPEG conversion failed', error);
    throw error instanceof Error
      ? error
      : new Error('HEIC formatı dönüştürülemedi, lütfen farklı bir format yükleyin.');
  }
}

