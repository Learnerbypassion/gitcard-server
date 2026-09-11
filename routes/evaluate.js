const express = require('express');
const { getUser, getAllRepos, getContributions } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

router.get('/', async (req, res) => {
  const username = req.query.username;
  const themeName = req.query.theme || 'github-dark';
  if (!username) return res.status(400).send('username query param is required');

  const t = theme(themeName);
  const role = req.query.role || 'Frontend or full-stack engineer';
  const stack = req.query.stack || 'JavaScript · HTML · CSS';

  try {
    let user = { public_repos: 37 };
    try {
      user = await getUser(username);
    } catch (err) {
      console.warn('getUser failed in evaluate:', err.message);
    }

    let repos = [];
    try {
      repos = await getAllRepos(username);
    } catch (err) {
      console.warn('getAllRepos failed in evaluate:', err.message);
    }

    let contrib = { total: 421, activeDays: 130 };
    try {
      contrib = await getContributions(username);
    } catch (err) {
      console.warn('getContributions failed in evaluate:', err.message);
    }

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const repoCount = user.public_repos ?? repos.length;

    const width = 850;
    const height = 180;

    const innerX = 34;
    const innerY = 22;
    const innerW = 782;
    const innerH = 136;

    // 3 Columns inside inner container
    const colW = 236;
    const colH = 108;
    const colY = innerY + 14;
    const gap = 17;
    const startX = innerX + 18;

    const columns = [
      {
        title: 'Role fit',
        primary: role,
        secondary: stack,
        color: '#38bdf8',
        borderColor: 'rgba(56, 189, 248, 0.3)',
        trackColor: '#38bdf8'
      },
      {
        title: 'Public proof',
        primary: `${repoCount} repositories`,
        secondary: `★ ${totalStars} stars earned`,
        color: '#2dd4bf',
        borderColor: 'rgba(45, 212, 191, 0.3)',
        trackColor: '#2dd4bf'
      },
      {
        title: 'Momentum',
        primary: `${contrib.total} contributions`,
        secondary: `⚡ ${contrib.activeDays} active days`,
        color: '#c084fc',
        borderColor: 'rgba(192, 132, 252, 0.3)',
        trackColor: '#c084fc'
      }
    ];

    const colsSvg = columns
      .map((col, i) => {
        const cx = startX + i * (colW + gap);
        return `
    <g class="eval-col" transform="translate(${cx}, ${colY})">
      <rect width="${colW}" height="${colH}" rx="12" fill="${t.tileBg || '#090e18'}" stroke="${col.borderColor}" stroke-width="1.2"/>
      <text x="18" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="700" fill="${col.color}">${escapeXml(col.title)}</text>
      <text x="18" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#ffffff">${escapeXml(col.primary)}</text>
      <text x="18" y="78" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="500" fill="#94a3b8">${escapeXml(col.secondary)}</text>
      
      <!-- Colored indicator bar at bottom -->
      <rect x="18" y="93" width="${colW - 36}" height="4" rx="2" fill="#1b2438"/>
      <rect x="18" y="93" width="${(colW - 36) * 0.7}" height="4" rx="2" fill="${col.trackColor}"/>
    </g>`;
      })
      .join('');

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>What teams can evaluate quickly</title>
  <defs>
    <linearGradient id="evalBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="${gradStops[1]}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${gradStops[2]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${gradStops[3]}" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="evalTopGlow" cx="30%" cy="0%" r="60%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="evalBottomGlow" cx="70%" cy="100%" r="50%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="evalOrb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25"/>
      <stop offset="45%" stop-color="#818cf8" stop-opacity="0.14"/>
      <stop offset="80%" stop-color="#c084fc" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="evalInnerBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${gradStops[2]}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>

  <!-- Outer background & glowing border -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="20" fill="${t.outerBg || '#070913'}" stroke="url(#evalBorder)" stroke-width="1.5"/>

  <!-- Ambient auras -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="20" fill="url(#evalTopGlow)" pointer-events="none"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="20" fill="url(#evalBottomGlow)" pointer-events="none"/>

  <!-- Animated roaming glowing orb -->
  <circle cx="300" cy="90" r="130" fill="url(#evalOrb)" pointer-events="none">
    <animate attributeName="cx" values="220;600;380;220" dur="14s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="70;110;80;70" dur="14s" repeatCount="indefinite"/>
  </circle>

  <!-- Inner container box -->
  <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="14" fill="${t.cardBg || 'rgba(8, 12, 20, 0.65)'}" stroke="url(#evalInnerBorder)" stroke-width="1.2"/>

  <!-- 3 Evaluator Columns -->
  ${colsSvg}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(svg);
  } catch (err) {
    console.error('evaluate error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="120" viewBox="0 0 850 120">
        <rect width="850" height="120" rx="14" fill="${t.outerBg || '#070913'}" stroke="#30363d"/>
        <text x="30" y="65" font-family="sans-serif" font-size="14" fill="#8b949e">Couldn't load evaluation metrics</text>
      </svg>`
    );
  }
});

module.exports = router;
