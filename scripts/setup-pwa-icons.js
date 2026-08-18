const fs = require('fs');
const path = require('path');

const srcImagePath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\f039790e-0e66-4698-acc6-cc92b2cd262d\\rajinqu_icon_fullbleed_1787006424048.jpg';
const publicDir = path.join(__dirname, '..', 'public');

if (fs.existsSync(srcImagePath)) {
  const imageBuffer = fs.readFileSync(srcImagePath);
  
  const iconTargets = [
    'icon-512.png',
    'icon-192.png',
    'icon-maskable.png',
    'apple-touch-icon.png',
    'logo-pwa.png',
    'favicon.png'
  ];

  for (const name of iconTargets) {
    const targetPath = path.join(publicDir, name);
    fs.writeFileSync(targetPath, imageBuffer);
    console.log(`[PWA Icon] Created ${name} (${imageBuffer.length} bytes)`);
  }
} else {
  console.error('Source image not found at:', srcImagePath);
}
