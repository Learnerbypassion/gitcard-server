const express = require('express');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const { getUser } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

// Load local high-res ASCII portrait if available
let cachedBase64Portrait = null;
const portraitPath = path.join(__dirname, '../assets/portrait_512.jpg');
if (fs.existsSync(portraitPath)) {
  const buf = fs.readFileSync(portraitPath);
  cachedBase64Portrait = 'data:image/jpeg;base64,' + buf.toString('base64');
}

const COLOR_MATRICES = {
  cyan: `
    0.22 0 0 0 0
    0 0.76 0 0 0
    0 0 0.98 0 0
    0 0 0 1 0
  `,
  white: null,
  green: `
    0.14 0 0 0 0
    0 0.88 0 0 0
    0 0 0.35 0 0
    0 0 0 1 0
  `,
  purple: `
    0.75 0 0 0 0
    0 0.45 0 0 0
    0 0 0.98 0 0
    0 0 0 1 0
  `
};

router.get('/', async (req, res) => {
  const username = req.query.username || 'learnerbypassion';
  const themeName = req.query.theme || 'github-dark';
  const colorMode = req.query.color || 'cyan'; // 'cyan', 'white', 'green', 'purple'

  const t = theme(themeName);

  try {
    const width = 390;
    const height = 420;

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];
    const matrix = COLOR_MATRICES[colorMode] || COLOR_MATRICES.cyan;
    const filterAttr = matrix ? 'filter="url(#asciiColor)"' : '';

    // If we have the user's high-res ASCII portrait asset, render it with terminal styling
    if (cachedBase64Portrait && (username.toLowerCase() === 'learnerbypassion' || req.query.custom === 'true' || !req.query.avatar)) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>${escapeXml(username)} animated ASCII portrait</title>
  <defs>
    <linearGradient id="portBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="${gradStops[1]}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${gradStops[2]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${gradStops[3]}" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="portOrb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="scanBeam" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </linearGradient>
    ${
      matrix
        ? `<filter id="asciiColor" color-interpolation-filters="sRGB">
      <feColorMatrix type="matrix" values="${matrix}"/>
    </filter>`
        : ''
    }
  </defs>

  <!-- Outer background & glowing border -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="${t.outerBg || '#070913'}" stroke="url(#portBorder)" stroke-width="1.5"/>

  <!-- Roaming background orb -->
  <circle cx="200" cy="200" r="140" fill="url(#portOrb)" pointer-events="none">
    <animate attributeName="cx" values="140;260;180;140" dur="12s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="160;280;190;160" dur="12s" repeatCount="indefinite"/>
  </circle>

  <!-- Inner terminal window -->
  <rect x="16" y="16" width="358" height="388" rx="14" fill="#05070d" stroke="rgba(56, 189, 248, 0.25)" stroke-width="1.2"/>

  <!-- Terminal top bar -->
  <circle cx="34" cy="34" r="4.5" fill="#ff5f56"/>
  <circle cx="48" cy="34" r="4.5" fill="#ffbd2e"/>
  <circle cx="62" cy="34" r="4.5" fill="#27c93f"/>
  <text x="78" y="38" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11" font-weight="600" fill="#64748b">${escapeXml(username)}@terminal:~# <tspan fill="#38bdf8">./portrait.sh</tspan><tspan fill="#38bdf8"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>_</tspan></text>
  <line x1="16" y1="48" x2="374" y2="48" stroke="#1e293b" stroke-width="1"/>

  <!-- High-fidelity ASCII portrait image -->
  <image href="${cachedBase64Portrait}" x="22" y="54" width="346" height="344" preserveAspectRatio="xMidYMid meet" ${filterAttr}/>

  <!-- CRT Scanline beam sweeping continuously -->
  <rect x="22" y="54" width="346" height="32" fill="url(#scanBeam)" pointer-events="none">
    <animate attributeName="y" values="54;360;54" dur="4.5s" repeatCount="indefinite"/>
  </rect>
</svg>`;

      res.set('Content-Type', 'image/svg+xml');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      return res.send(svg);
    }

    // Dynamic Jimp fallback for any other user
    let user = { name: username, avatar_url: `https://github.com/${username}.png` };
    try {
      user = await getUser(username);
    } catch (_) {}

    const avatarUrl = user.avatar_url || `https://github.com/${username}.png`;
    const image = await Jimp.read(avatarUrl);
    const COLS = 54;
    const ROWS = 30;
    image.resize(COLS, ROWS).greyscale();

    const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
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
    const svgWidth = Math.round(COLS * charW + padX * 2);
    const svgHeight = Math.round(ROWS * charH + padY * 2 + 36);

    const textRows = rows
      .map((row, i) => {
        return `<text x="${padX}" y="${padY + 32 + i * charH}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9.5" fill="#38bdf8" xml:space="preserve">${escapeXml(row)}</text>`;
      })
      .join('');

    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img">
  <defs>
    <linearGradient id="portBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="${gradStops[1]}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${gradStops[2]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${gradStops[3]}" stop-opacity="0.8"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="${svgWidth - 2}" height="${svgHeight - 2}" rx="16" fill="#070913" stroke="url(#portBorder)" stroke-width="1.5"/>
  <circle cx="${padX}" cy="${padY + 4}" r="4.5" fill="#ff5f56"/>
  <circle cx="${padX + 14}" cy="${padY + 4}" r="4.5" fill="#ffbd2e"/>
  <circle cx="${padX + 28}" cy="${padY + 4}" r="4.5" fill="#27c93f"/>
  <text x="${padX + 44}" y="${padY + 8}" font-family="ui-monospace, monospace" font-size="11" fill="#64748b">${escapeXml(username)}@terminal:~# <tspan fill="#38bdf8">./portrait.sh</tspan></text>
  <line x1="${padX - 6}" y1="${padY + 18}" x2="${svgWidth - padX + 6}" y2="${padY + 18}" stroke="#1e293b" stroke-width="1"/>
  ${textRows}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(fallbackSvg);
  } catch (err) {
    console.error('portrait error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="120">
        <rect width="360" height="120" rx="14" fill="#070913" stroke="#30363d"/>
        <text x="20" y="65" font-family="sans-serif" font-size="13" fill="#8b949e">Couldn't render portrait</text>
      </svg>`
    );
  }
});

module.exports = router;
