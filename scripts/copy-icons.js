const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\User\\.gemini\\antigravity-ide\\brain\\f039790e-0e66-4698-acc6-cc92b2cd262d\\rajinqu_icon_fullbleed_1787006424048.jpg';
const destDir = path.join(__dirname, '..', 'public');

if (fs.existsSync(srcPath)) {
  const targetFiles = [
    'icon-512.png',
    'icon-192.png',
    'icon-maskable.png',
    'apple-touch-icon.png',
    'logo-pwa.png'
  ];

  for (const file of targetFiles) {
    const dest = path.join(destDir, file);
    fs.copyFileSync(srcPath, dest);
    console.log(`Copied to ${dest}`);
  }
} else {
  console.error('Source file not found:', srcPath);
}
