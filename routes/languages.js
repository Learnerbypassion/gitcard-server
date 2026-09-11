const express = require('express');
const { getAllRepos } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  TypeScript: '#3178c6',
  CSS: '#7057ff',
  C: '#555555',
  'C++': '#f34b7d',
  Python: '#3572A5',
  PowerShell: '#012456',
  Java: '#b07219',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  Vue: '#41b883',
  Dart: '#00B4AB',
  Dockerfile: '#384d54'
};

const DEFAULT_COLOR = '#38bdf8';

router.get('/', async (req, res) => {
  const themeName = req.query.theme || 'github-dark';
  const t = theme(themeName);
  const username = req.query.username;
  const isCompact = req.query.layout === 'compact';

  try {
    let languages = [];

    if (username) {
      try {
        const repos = await getAllRepos(username);
        const totals = {};

        // Top repos byte counts fetch for accuracy
        const sampleRepos = repos.slice(0, 10);
        const byteResults = await Promise.all(
          sampleRepos.map((r) =>
            fetch(`https://api.github.com/repos/${r.full_name}/languages`, {
              headers: { 'User-Agent': 'gitcard-server' }
            })
              .then((res) => res.json())
              .catch(() => ({}))
          )
        );

        byteResults.forEach((b) => {
          Object.entries(b).forEach(([lang, bytes]) => {
            if (typeof bytes === 'number') {
              totals[lang] = (totals[lang] || 0) + bytes;
            }
          });
        });

        // Add remaining repo primary languages with fallback baseline
        repos.forEach((r) => {
          if (r.language && !totals[r.language]) {
            totals[r.language] = (r.size || 10) * 1024;
          }
        });

        const totalBytes = Object.values(totals).reduce((sum, b) => sum + b, 0);

        if (totalBytes > 0) {
          languages = Object.entries(totals)
            .map(([name, bytes]) => {
              const rawPct = (bytes / totalBytes) * 100;
              return {
                name,
                rawPct,
                pct: rawPct.toFixed(2),
                color: LANG_COLORS[name] || DEFAULT_COLOR
              };
            })
            .sort((a, b) => b.rawPct - a.rawPct)
            .slice(0, 8);
        }
      } catch (err) {
        console.warn('Could not fetch user language stats:', err.message);
      }
    }

    // Default reference fallback if no data
    if (languages.length === 0) {
      languages = [
        { name: 'JavaScript', rawPct: 75.98, pct: '75.98', color: '#f1e05a' },
        { name: 'HTML', rawPct: 6.87, pct: '6.87', color: '#e34c26' },
        { name: 'TypeScript', rawPct: 5.84, pct: '5.84', color: '#3178c6' },
        { name: 'CSS', rawPct: 5.79, pct: '5.79', color: '#7057ff' },
        { name: 'C', rawPct: 3.07, pct: '3.07', color: '#555555' },
        { name: 'C++', rawPct: 2.20, pct: '2.20', color: '#f34b7d' },
        { name: 'Python', rawPct: 0.19, pct: '0.19', color: '#3572A5' },
        { name: 'PowerShell', rawPct: 0.07, pct: '0.07', color: '#012456' }
      ];
    }

    const width = isCompact ? 520 : 850;
    const height = isCompact ? 240 : 290;

    const innerX = isCompact ? 20 : 30;
    const innerY = isCompact ? 16 : 20;
    const innerW = width - innerX * 2;
    const innerH = height - innerY * 2;

    const titleX = isCompact ? 36 : 56;
    const titleY = isCompact ? 48 : 58;

    const barX = titleX;
    const barY = isCompact ? 68 : 82;
    const barW = width - barX * 2;
    const barH = isCompact ? 10 : 12;

    // Build continuous segmented progress bar
    let accumulatedX = barX;
    const segmentsSvg = languages
      .map((item) => {
        const segW = Math.max(3, (item.rawPct / 100) * barW);
        const thisX = accumulatedX;
        accumulatedX += segW;
        return `<rect x="${thisX}" y="${barY}" width="${segW}" height="${barH}" fill="${item.color}"/>`;
      })
      .join('');

    // Two column layout below the bar
    const midIdx = Math.ceil(languages.length / 2);
    const col1 = languages.slice(0, midIdx);
    const col2 = languages.slice(midIdx);

    const col1X = isCompact ? 38 : 60;
    const col2X = isCompact ? width / 2 + 10 : 450;
    const startRowY = isCompact ? 108 : 132;
    const rowStep = isCompact ? 26 : 32;

    const renderColumn = (items, startX) => {
      return items
        .map((item, i) => {
          const y = startRowY + i * rowStep;
          return `
    <g class="lang-item" transform="translate(${startX}, ${y})">
      <circle cx="5" cy="-4.5" r="4.5" fill="${item.color}"/>
      <text x="18" y="0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${isCompact ? 12 : 14}">
        <tspan font-weight="600" fill="#ffffff">${escapeXml(item.name)}</tspan>
        <tspan dx="6" font-weight="600" fill="#2dd4bf">${item.pct}%</tspan>
      </text>
    </g>`;
        })
        .join('');
    };

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>Most Used Languages</title>
  <defs>
    <linearGradient id="langBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.85"/>
      <stop offset="35%" stop-color="${gradStops[1]}" stop-opacity="0.75"/>
      <stop offset="70%" stop-color="${gradStops[2]}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${gradStops[3]}" stop-opacity="0.8"/>
    </linearGradient>
    <radialGradient id="langTopGlow" cx="25%" cy="0%" r="60%">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.18"/>
      <stop offset="50%" stop-color="#10b981" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="langBottomGlow" cx="75%" cy="100%" r="50%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="langOrb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.25"/>
      <stop offset="45%" stop-color="#38bdf8" stop-opacity="0.14"/>
      <stop offset="80%" stop-color="#10b981" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${t.outerBg || '#070913'}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="langInnerBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStops[0]}" stop-opacity="0.25"/>
      <stop offset="50%" stop-color="#1e293b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${gradStops[2]}" stop-opacity="0.25"/>
    </linearGradient>
    <clipPath id="segmentedBarClip">
      <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="6"/>
    </clipPath>
  </defs>

  <!-- Outer background & glowing border -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="20" fill="${t.outerBg || '#070913'}" stroke="url(#langBorder)" stroke-width="1.5"/>

  <!-- Ambient auras -->
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="20" fill="url(#langTopGlow)" pointer-events="none"/>
  <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="20" fill="url(#langBottomGlow)" pointer-events="none"/>

  <!-- Animated roaming glowing orb -->
  <circle cx="${width * 0.4}" cy="100" r="130" fill="url(#langOrb)" pointer-events="none">
    <animate attributeName="cx" values="${width * 0.3};${width * 0.7};${width * 0.4};${width * 0.3}" dur="14s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="90;150;110;90" dur="14s" repeatCount="indefinite"/>
  </circle>

  <!-- Inner container box -->
  <rect x="${innerX}" y="${innerY}" width="${innerW}" height="${innerH}" rx="14" fill="${t.cardBg || 'rgba(8, 12, 20, 0.65)'}" stroke="url(#langInnerBorder)" stroke-width="1.2"/>

  <!-- Title: Most Used Languages -->
  <text x="${titleX}" y="${titleY}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${isCompact ? 20 : 24}" font-weight="800" fill="#c084fc" letter-spacing="-0.3">Most Used Languages</text>

  <!-- Continuous Segmented Progress Bar (Clipped with rounded ends) -->
  <g clip-path="url(#segmentedBarClip)">
    <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="#1e293b"/>
    ${segmentsSvg}
  </g>

  <!-- 2 Column Language List -->
  ${renderColumn(col1, col1X)}
  ${renderColumn(col2, col2X)}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(svg);
  } catch (err) {
    console.error('languages error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="150" viewBox="0 0 520 150">
        <rect width="520" height="150" rx="14" fill="${t.outerBg || '#070913'}" stroke="#30363d"/>
        <text x="30" y="75" font-family="sans-serif" font-size="14" fill="#8b949e">Couldn't load language stats</text>
      </svg>`
    );
  }
});

module.exports = router;
