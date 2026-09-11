const express = require('express');
const Jimp = require('jimp');
const { getUser } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
const COLS = 40;
const ROWS = 20;

router.get('/', async (req, res) => {
  const username = req.query.username;
  const themeName = req.query.theme || 'github-dark';
  if (!username) return res.status(400).send('username query param is required');

  const t = theme(themeName);
  const role = req.query.role || 'Frontend or full-stack engineer';
  const bio = req.query.bio || 'Building useful software and sharing the work in public.';

  try {
    let user = { name: username, avatar_url: `https://github.com/${username}.png` };
    try {
      user = await getUser(username);
    } catch (err) {
      console.warn('getUser failed in hero:', err.message);
    }

    const avatarUrl = user.avatar_url || `https://github.com/${username}.png`;

    let rows = [];
    try {
      const image = await Jimp.read(avatarUrl);
      image.resize(COLS, ROWS).greyscale();
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
    } catch (err) {
      console.warn('Jimp failed:', err.message);
    }

    const width = 850;
    const height = 360;

    const innerX = 34;
    const innerY = 28;
    const innerW = 782;
    const innerH = 304;

    const termX = 520;
    const termY = 48;
    const termW = 276;
    const termH = 264;
    const charH = 11;

    const asciiRows = rows
      .map((row, i) => {
        return `<text x="${termX + 16}" y="${termY + 38 + i * charH}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="9" fill="url(#heroAsciiGrad)" xml:space="preserve">${escapeXml(row)}</text>`;
      })
      .join('');

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];
    const badgeText = `RECRUITER SIGNAL BRIEF · ${username}`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>${escapeXml(user.name || username)} Profile Brief</title>
  <defs>
    <linearGradient id="heroBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="${gradStops[1]}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${gradStops[2]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${gradStops[3]}" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="heroTopGlow" cx="30%" cy="0%" r="55%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="heroBottomGlow" cx="70%" cy="100%" r="50%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="heroRoamingOrb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
      <stop offset="40%" stop-color="#818cf8" stop-opacity="0.16"/>
      <stop offset="75%" stop-color="#c084fc" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="heroAsciiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#818cf8"/>
    </linearGradient>
    <linearGradient id="heroInnerBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${gradStops[2]}" stop-opacity="0.25"/>
    </linearGradient>
    <linearGradient id="heroScan" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
      <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Outer background & glowing border -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="22" fill="${t.outerBg || '#070913'}" stroke="url(#heroBorder)" stroke-width="1.5"/>

  <!-- Ambient auras -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="22" fill="url(#heroTopGlow)" pointer-events="none"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="22" fill="url(#heroBottomGlow)" pointer-events="none"/>

  <!-- Animated roaming glowing orb -->
  <circle cx="240" cy="120" r="140" fill="url(#heroRoamingOrb)" pointer-events="none">
    <animate attributeName="cx" values="200;640;400;200" dur="16s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="120;160;270;120" dur="16s" repeatCount="indefinite"/>
  </circle>

  <!-- Inner container box -->
  <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="16" fill="${t.cardBg || 'rgba(8, 12, 20, 0.65)'}" stroke="url(#heroInnerBorder)" stroke-width="1.2"/>

  <!-- LEFT HERO COLUMN -->
  <!-- Recruiter brief pill badge -->
  <rect x="60" y="54" width="270" height="24" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.3)" stroke-width="0.8"/>
  <circle cx="73" cy="66" r="3.5" fill="#10b981">
    <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite"/>
  </circle>
  <text x="84" y="70" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="10.5" font-weight="700" fill="#38bdf8" letter-spacing="0.5">${escapeXml(badgeText)}</text>

  <!-- Candidate Name -->
  <text x="60" y="116" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="32" font-weight="800" fill="${t.titleText || '#ffffff'}" letter-spacing="-0.5">${escapeXml(user.name || username)}</text>

  <!-- Role / Headline -->
  <text x="60" y="148" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" fill="#38bdf8">${escapeXml(role)}</text>

  <!-- Bio / Tagline -->
  <text x="60" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="500" fill="${t.subtext || '#94a3b8'}">${escapeXml(bio)}</text>

  <!-- Status pill -->
  <rect x="60" y="206" width="258" height="28" rx="8" fill="#0b1120" stroke="#1e293b" stroke-width="1"/>
  <circle cx="76" cy="220" r="4" fill="#22c55e">
    <animate attributeName="r" values="3.5;4.5;3.5" dur="2s" repeatCount="indefinite"/>
  </circle>
  <text x="88" y="224" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" fill="#e2e8f0">Building and sharing work in public</text>

  <!-- Skill chips -->
  <g transform="translate(60, 252)">
    <rect x="0" y="0" width="82" height="22" rx="5" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.25)" stroke-width="0.8"/>
    <text x="41" y="15" font-family="sans-serif" font-size="11" font-weight="600" fill="#38bdf8" text-anchor="middle">JavaScript</text>

    <rect x="90" y="0" width="58" height="22" rx="5" fill="rgba(45, 212, 191, 0.1)" stroke="rgba(45, 212, 191, 0.25)" stroke-width="0.8"/>
    <text x="119" y="15" font-family="sans-serif" font-size="11" font-weight="600" fill="#2dd4bf" text-anchor="middle">React</text>

    <rect x="156" y="0" width="76" height="22" rx="5" fill="rgba(192, 132, 252, 0.1)" stroke="rgba(192, 132, 252, 0.25)" stroke-width="0.8"/>
    <text x="194" y="15" font-family="sans-serif" font-size="11" font-weight="600" fill="#c084fc" text-anchor="middle">HTML / CSS</text>

    <rect x="240" y="0" width="68" height="22" rx="5" fill="rgba(74, 222, 128, 0.1)" stroke="rgba(74, 222, 128, 0.25)" stroke-width="0.8"/>
    <text x="274" y="15" font-family="sans-serif" font-size="11" font-weight="600" fill="#4ade80" text-anchor="middle">Node.js</text>
  </g>

  <!-- RIGHT TERMINAL COLUMN (ANIMATED ASCII PORTRAIT) -->
  <g>
    <!-- Terminal window box -->
    <rect x="${termX}" y="${termY}" width="${termW}" height="${termH}" rx="12" fill="#060913" stroke="rgba(56, 189, 248, 0.3)" stroke-width="1.2"/>

    <!-- Mac-style window controls -->
    <circle cx="${termX + 16}" cy="${termY + 16}" r="4" fill="#ff5f56"/>
    <circle cx="${termX + 28}" cy="${termY + 16}" r="4" fill="#ffbd2e"/>
    <circle cx="${termX + 40}" cy="${termY + 16}" r="4" fill="#27c93f"/>
    <text x="${termX + 54}" y="${termY + 19.5}" font-family="ui-monospace, monospace" font-size="10" fill="#64748b">${escapeXml(username)}@avatar:~# <tspan fill="#38bdf8"><animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>_</tspan></text>
    <line x1="${termX}" y1="${termY + 28}" x2="${termX + termW}" y2="${termY + 28}" stroke="#1e293b" stroke-width="1"/>

    <!-- Animated ASCII grid -->
    <g>
      <animate attributeName="opacity" values="0.88;1;0.88" dur="3s" repeatCount="indefinite"/>
      ${asciiRows}
    </g>

    <!-- CRT scanline beam -->
    <rect x="${termX + 6}" y="${termY + 30}" width="${termW - 12}" height="24" fill="url(#heroScan)" pointer-events="none">
      <animate attributeName="y" values="${termY + 30};${termY + termH - 30};${termY + 30}" dur="4s" repeatCount="indefinite"/>
    </rect>
  </g>
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(svg);
  } catch (err) {
    console.error('hero error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="180" viewBox="0 0 850 180">
        <rect width="850" height="180" rx="16" fill="${t.outerBg || '#070913'}" stroke="#30363d"/>
        <text x="40" y="60" font-family="sans-serif" font-size="22" font-weight="700" fill="#ffffff">Hero Brief</text>
        <text x="40" y="95" font-family="sans-serif" font-size="13" fill="#8b949e">Couldn't load brief</text>
      </svg>`
    );
  }
});

module.exports = router;
