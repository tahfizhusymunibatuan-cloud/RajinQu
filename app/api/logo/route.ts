import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  const fileName = type === 'white' ? 'logo-pondok-white.png' : 'logo-pondok.png';
  
  // 1. Cek di folder public proyek (tersedia di Vercel & Production)
  const publicPath = path.join(process.cwd(), 'public', fileName);
  const defaultPublicPath = path.join(process.cwd(), 'public', 'logo-pondok.png');

  // 2. Fallback path lokal dev
  const greenLogoPath = 'C:/Users/User/.gemini/antigravity-ide/brain/bc72668b-f676-432d-aaef-4184e257604f/.user_uploaded/media_1786898260078.png';
  const whiteLogoPath = 'C:/Users/User/.gemini/antigravity-ide/brain/bc72668b-f676-432d-aaef-4184e257604f/.user_uploaded/media_1786898260113.png';
  const localBrainPath = type === 'white' ? whiteLogoPath : greenLogoPath;

  try {
    let targetPath = '';
    if (fs.existsSync(publicPath)) {
      targetPath = publicPath;
    } else if (fs.existsSync(defaultPublicPath)) {
      targetPath = defaultPublicPath;
    } else if (fs.existsSync(localBrainPath)) {
      targetPath = localBrainPath;
    }

    if (targetPath) {
      const fileBuffer = fs.readFileSync(targetPath);
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  } catch (error) {
    console.error('Error serving pondok logo:', error);
  }

  // Jika tidak ditemukan, redirect ke static public file
  return NextResponse.redirect(new URL('/logo-pondok.png', req.url));
}
