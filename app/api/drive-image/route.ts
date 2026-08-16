import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let id = searchParams.get('id');
  const url = searchParams.get('url');

  if (!id && url) {
    // Extract fileId from URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      id = match[1];
    }
  }

  if (!id) {
    return new NextResponse('Missing image id', { status: 400 });
  }

  try {
    // URL Google Drive Thumbnail berkecepatan tinggi & bebas blokir hotlinking
    const googleThumbnailUrl = `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
    
    const response = await fetch(googleThumbnailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      });
    }
  } catch (error) {
    console.error('Error proxying drive image:', error);
  }

  // Fallback redirect ke thumbnail
  return NextResponse.redirect(`https://drive.google.com/thumbnail?id=${id}&sz=w800`);
}
