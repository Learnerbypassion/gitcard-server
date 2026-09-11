const express = require('express');
const { getUser, getAllRepos, getContributions } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

router.get('/', async (req, res) => {
  const username = req.query.username;
  const themeName = req.query.theme || 'github-dark';
  if (!username) return res.status(400).send('username query param is required');

  const t = theme(themeName);

  try {
    let user = { name: username, public_repos: 0, followers: 0 };
    try {
      user = await getUser(username);
    } catch (err) {
      console.warn('getUser failed:', err.message);
    }

    let repos = [];
    try {
      repos = await getAllRepos(username);
    } catch (err) {
      console.warn('getAllRepos failed:', err.message);
    }

    let contrib = { total: 0, activeDays: 0 };
    try {
      contrib = await getContributions(username);
    } catch (_) {
      // Contribution scraping is best-effort; card still renders without it.
    }

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const repoCount = user.public_repos ?? repos.length;
    const followers = user.followers ?? 0;

    const width = 850;
    const height = 340;

    const tilesData = [
      {
        label: t.tiles?.stars?.label || 'Stars',
        value: totalStars,
        color: t.tiles?.stars?.color || '#38bdf8',
        borderColor: t.tiles?.stars?.border || 'rgba(56, 189, 248, 0.35)',
        barWidth: calculateBarWidth(totalStars, 30000, 134)
      },
      {
        label: t.tiles?.contributions?.label || 'Contributions',
        value: contrib.total,
        color: t.tiles?.contributions?.color || '#2dd4bf',
        borderColor: t.tiles?.contributions?.border || 'rgba(45, 212, 191, 0.35)',
        barWidth: calculateBarWidth(contrib.total, 2500, 134)
      },
      {
        label: t.tiles?.repos?.label || 'Repos',
        value: repoCount,
        color: t.tiles?.repos?.color || '#c084fc',
        borderColor: t.tiles?.repos?.border || 'rgba(192, 132, 252, 0.35)',
        barWidth: calculateBarWidth(repoCount, 50, 134)
      },
      {
        label: t.tiles?.followers?.label || 'Followers',
        value: followers,
        color: t.tiles?.followers?.color || '#4ade80',
        borderColor: t.tiles?.followers?.border || 'rgba(74, 222, 128, 0.35)',
        barWidth: calculateBarWidth(followers, 30000, 134)
      }
    ];

    const innerX = 34;
    const innerY = 28;
    const innerW = 782;
    const innerH = 264;

    const tileW = 174;
    const tileH = 152;
    const tileY = 118;
    const tileGap = 14;
    const tilePadLeft = 22;

    const tilesSvg = tilesData
      .map((tile, i) => {
        const tx = innerX + tilePadLeft + i * (tileW + tileGap);
        const padX = tx + 20;
        return `
    <g class="stat-tile" transform="translate(0, 0)">
      <rect x="${tx}" y="${tileY}" width="${tileW}" height="${tileH}" rx="14" fill="${t.tileBg || '#090e18'}" stroke="${tile.borderColor}" stroke-width="1.2"/>
      <text x="${padX}" y="${tileY + 30}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="${t.subtext || '#94a3b8'}">${escapeXml(tile.label)}</text>
      <text x="${padX}" y="${tileY + 76}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="800" fill="${tile.color}" letter-spacing="-0.5">${formatNumber(tile.value)}</text>
      <rect x="${padX}" y="${tileY + 114}" width="134" height="6" rx="3" fill="${t.track || '#152033'}"/>
      <rect x="${padX}" y="${tileY + 114}" width="${tile.barWidth}" height="6" rx="3" fill="${tile.color}"/>
    </g>`;
      })
      .join('');

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];
    const titleText = 'Profile Signal';
    const subtitleText = 'Live GitHub developer metrics';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>${escapeXml(user.name || username)} GitHub Profile Signal</title>
  <defs>
    <linearGradient id="cardBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="${gradStops[1]}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${gradStops[2]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${gradStops[3]}" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="topGlow" cx="40%" cy="0%" r="60%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/>
      <stop offset="40%" stop-color="#10b981" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bottomGlow" cx="60%" cy="100%" r="50%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="roamingOrb1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.32"/>
      <stop offset="40%" stop-color="#818cf8" stop-opacity="0.18"/>
      <stop offset="75%" stop-color="#c084fc" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="roamingOrb2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.26"/>
      <stop offset="45%" stop-color="#06b6d4" stop-opacity="0.14"/>
      <stop offset="80%" stop-color="#3b82f6" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="innerBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${gradStops[2]}" stop-opacity="0.25"/>
    </linearGradient>
  </defs>

  <!-- Outer background & glowing border -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="22" fill="${t.outerBg || '#070913'}" stroke="url(#cardBorder)" stroke-width="1.5"/>

  <!-- Ambient auras -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="22" fill="url(#topGlow)" pointer-events="none"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="22" fill="url(#bottomGlow)" pointer-events="none"/>

  <!-- Animated roaming glowing orbs -->
  <circle cx="200" cy="100" r="140" fill="url(#roamingOrb1)" pointer-events="none">
    <animate attributeName="cx" values="180;680;420;180" dur="16s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="90;140;250;90" dur="16s" repeatCount="indefinite"/>
  </circle>
  <circle cx="640" cy="220" r="130" fill="url(#roamingOrb2)" pointer-events="none">
    <animate attributeName="cx" values="640;220;520;640" dur="20s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="220;250;90;220" dur="20s" repeatCount="indefinite"/>
  </circle>

  <!-- Radar signal rings in top right -->
  <g stroke="${t.radarColor || '#10b981'}" fill="none" stroke-width="1.2" pointer-events="none">
    <circle cx="735" cy="112" r="38" stroke-opacity="${t.radarOpacity || 0.07}"/>
    <circle cx="735" cy="112" r="70" stroke-opacity="${(t.radarOpacity || 0.07) * 0.85}"/>
    <circle cx="735" cy="112" r="102" stroke-opacity="${(t.radarOpacity || 0.07) * 0.7}"/>
    <circle cx="735" cy="112" r="134" stroke-opacity="${(t.radarOpacity || 0.07) * 0.5}"/>
  </g>

  <!-- Inner container box -->
  <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="16" fill="${t.cardBg || 'rgba(8, 12, 20, 0.65)'}" stroke="url(#innerBorder)" stroke-width="1.2"/>

  <!-- Header -->
  <text x="56" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="${t.titleText || '#ffffff'}" letter-spacing="-0.4">${titleText}</text>
  <text x="56" y="93" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="${t.subtext || '#94a3b8'}" letter-spacing="0.2">${subtitleText}</text>

  <!-- 4 Stat tiles -->
  ${tilesSvg}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(svg);
  } catch (err) {
    console.error('stats error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(renderErrorCard(t, username));
  }
});

function formatNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 10000) return Math.round(num / 1000) + 'K';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

function calculateBarWidth(value, benchmark, trackWidth = 134) {
  const v = Number(value) || 0;
  if (v <= 0) return 8; // Small rounded pill indicator for 0
  const pct = Math.min(100, Math.max(6, (v / benchmark) * 100));
  return Math.max(8, Math.min(trackWidth, Math.round((pct / 100) * trackWidth)));
}

function renderErrorCard(t, username) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="180" viewBox="0 0 850 180">
  <rect x="1" y="1" width="848" height="178" rx="16" fill="${t.outerBg || '#070913'}" stroke="#30363d" stroke-width="1"/>
  <text x="40" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="800" fill="${t.titleText || '#ffffff'}">Profile Signal</text>
  <text x="40" y="100" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="${t.subtext || '#8b949e'}">Couldn't load stats for "${escapeXml(username)}". Please verify username.</text>
</svg>`;
}

module.exports = router;
