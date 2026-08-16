/**
 * Helper untuk mengunggah foto ke Google Drive via Google Apps Script (GAS)
 * membaca konfigurasi dari .env
 */

export interface UploadImageParams {
  imageBase64: string;
  fileName?: string;
  santriName?: string;
  kegiatanName?: string;
}

export interface UploadImageResult {
  success: boolean;
  fileUrl: string;
  fileId?: string;
  storageType: 'GOOGLE_DRIVE' | 'LOCAL_BASE64';
}

/**
 * Memastikan URL foto Google Drive dapat di-load tanpa terblokir status 429 oleh Google
 */
export function formatDriveImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('data:image/')) return url;
  if (url.includes('lh3.googleusercontent.com/d/')) {
    const fileId = url.split('/d/')[1];
    return `/api/drive-image?id=${fileId}`;
  }
  if (url.includes('drive.google.com') && url.includes('id=')) {
    const fileId = url.split('id=')[1]?.split('&')[0];
    return `/api/drive-image?id=${fileId}`;
  }
  return url;
}

export async function uploadImageToStorage({
  imageBase64,
  fileName,
  santriName,
  kegiatanName,
}: UploadImageParams): Promise<UploadImageResult> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        fileName,
        santriName,
        kegiatanName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    console.error('Failed to upload image via /api/upload:', error);
  }

  // Fallback jika API route gagal
  return {
    success: true,
    fileUrl: imageBase64,
    storageType: 'LOCAL_BASE64',
  };
}
