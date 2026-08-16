import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  const greenLogoPath = 'C:/Users/User/.gemini/antigravity-ide/brain/bc72668b-f676-432d-aaef-4184e257604f/.user_uploaded/media_1786898260078.png';
  const whiteLogoPath = 'C:/Users/User/.gemini/antigravity-ide/brain/bc72668b-f676-432d-aaef-4184e257604f/.user_uploaded/media_1786898260113.png';

  const targetPath = type === 'white' ? whiteLogoPath : greenLogoPath;

  try {
    if (fs.existsSync(targetPath)) {
      const fileBuffer = fs.readFileSync(targetPath);

      // Auto-save to public directory if possible
      try {
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const destFile = path.join(publicDir, type === 'white' ? 'logo-pondok-white.png' : 'logo-pondok.png');
        if (!fs.existsSync(destFile)) {
          fs.writeFileSync(destFile, fileBuffer);
        }
      } catch (e) {
        // ignore sync error
      }

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

  return new NextResponse('Logo not found', { status: 404 });
}
