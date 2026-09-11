const express = require('express');
const Jimp = require('jimp');
const { getUser } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

// Density ramp: sparsest -> densest glyph, mapped from pixel brightness.
const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

const COLS = 50;
const ROWS = 28;

router.get('/', async (req, res) => {
  const username = req.query.username;
  const themeName = req.query.theme || 'github-dark';
  if (!username) return res.status(400).send('username query param is required');

  const t = theme(themeName);

  try {
    let user = { name: username, avatar_url: `https://github.com/${username}.png` };
    try {
      user = await getUser(username);
    } catch (err) {
      console.warn('getUser failed in portrait:', err.message);
    }

    const avatarUrl = user.avatar_url || `https://github.com/${username}.png`;

    const image = await Jimp.read(avatarUrl);
    image.resize(COLS, ROWS).greyscale();

    const rows = [];
    for (let y = 0; y < ROWS; y++) {
      let row = '';
      for (let x = 0; x < COLS; x++) {
        const idx = image.getPixelIndex(x, y);
        const brightness = image.bitmap.data[idx];
        const rampIdx = Math.floor((brightness / 255) * (RAMP.length - 1));
        row += RAMP[rampIdx];
      }
      rows.push(row);
    }

    const charW = 6.4;
    const charH = 11.5;
    const padX = 22;
    const padY = 20;
    const width = Math.round(COLS * charW + padX * 2);
    const height = Math.round(ROWS * charH + padY * 2 + 36);

    const textRows = rows
      .map((row, i) => {
        return `<text x="${padX}" y="${padY + 32 + i * charH}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="9.5" fill="url(#asciiGrad)" xml:space="preserve">${escapeXml(row)}</text>`;
      })
      .join('');

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>${escapeXml(user.name || username)} animated ASCII portrait</title>
  <defs>
    <linearGradient id="portBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="${gradStops[1]}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${gradStops[2]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${gradStops[3]}" stop-opacity="0.8"/>
    </linearGradient>
    <linearGradient id="asciiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
    <radialGradient id="portOrb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#070913" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scanBeam" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Outer terminal window -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="16" fill="${t.outerBg || '#070913'}" stroke="url(#portBorder)" stroke-width="1.5"/>

  <!-- Roaming background orb -->
  <circle cx="${width / 2}" cy="${height / 2}" r="110" fill="url(#portOrb)" pointer-events="none">
    <animate attributeName="cx" values="${width * 0.3};${width * 0.7};${width * 0.4};${width * 0.3}" dur="12s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="${height * 0.3};${height * 0.65};${height * 0.4};${height * 0.3}" dur="12s" repeatCount="indefinite"/>
  </circle>

  <!-- Terminal top bar -->
  <circle cx="${padX}" cy="${padY + 4}" r="4.5" fill="#ff5f56"/>
  <circle cx="${padX + 14}" cy="${padY + 4}" r="4.5" fill="#ffbd2e"/>
  <circle cx="${padX + 28}" cy="${padY + 4}" r="4.5" fill="#27c93f"/>
  <text x="${padX + 44}" y="${padY + 8}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="600" fill="#64748b">${escapeXml(username)}@terminal:~# <tspan fill="#38bdf8">./portrait.sh</tspan><tspan fill="#38bdf8"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>_</tspan></text>
  
  <line x1="${padX - 6}" y1="${padY + 18}" x2="${width - padX + 6}" y2="${padY + 18}" stroke="#1e293b" stroke-width="1"/>

  <!-- Animated ASCII Text with subtle breathing glow -->
  <g>
    <animate attributeName="opacity" values="0.88;1;0.88" dur="4s" repeatCount="indefinite"/>
    ${textRows}
  </g>

  <!-- CRT Scanline beam passing over the portrait -->
  <rect x="${padX}" y="${padY + 22}" width="${width - padX * 2}" height="32" fill="url(#scanBeam)" pointer-events="none">
    <animate attributeName="y" values="${padY + 20};${height - padY - 20};${padY + 20}" dur="4.5s" repeatCount="indefinite"/>
  </rect>
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(svg);
  } catch (err) {
    console.error('portrait error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(errorSvg(t, `Couldn't render portrait for "${username}"`));
  }
});

function errorSvg(t, message) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120" viewBox="0 0 360 120">
  <rect width="360" height="120" rx="14" fill="${t.outerBg || '#070913'}" stroke="#30363d"/>
  <text x="20" y="65" font-family="sans-serif" font-size="13" fill="#8b949e">${message.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
</svg>`;
}

module.exports = router;
