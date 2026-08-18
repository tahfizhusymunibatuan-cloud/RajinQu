import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, fileName, santriName, kegiatanName } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const gasUrl =
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      process.env.NEXT_PUBLIC_GAS_UPLOAD_URL;

    // Jika URL GAS sudah diisi dan bukan placeholder bawaan
    if (gasUrl && !gasUrl.includes('YOUR_DEPLOY_ID') && gasUrl.startsWith('https://script.google.com')) {
      try {
        const response = await fetch(gasUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            imageBase64,
            fileName: fileName || `${santriName || 'santri'}_${Date.now()}`,
            santriName,
            kegiatanName,
          }),
          redirect: 'follow',
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && (result.fileId || result.fileUrl)) {
            const fileId = result.fileId || (result.fileUrl ? result.fileUrl.split('/d/')[1] : '');
            const finalUrl = fileId ? `/api/drive-image?id=${fileId}` : result.fileUrl;
            return NextResponse.json({
              success: true,
              fileUrl: finalUrl,
              fileId: fileId,
              storageType: 'GOOGLE_DRIVE',
            });
          }
        }
      } catch (gasError) {
        console.error('Error uploading to Google Apps Script:', gasError);
      }
    }

    // Fallback: Kembalikan base64 langsung jika GAS belum aktif / offline
    return NextResponse.json({
      success: true,
      fileUrl: imageBase64,
      storageType: 'LOCAL_BASE64',
    });
  } catch (error: any) {
    console.error('Upload route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
