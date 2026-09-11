const express = require('express');
const { getAllRepos } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#a855f7',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  Vue: '#41b883',
  React: '#61dafb',
  Dart: '#00B4AB'
};

const DEFAULT_COLOR = '#38bdf8';

router.get('/', async (req, res) => {
  const themeName = req.query.theme || 'github-dark';
  const t = theme(themeName);
  const username = req.query.username;

  try {
    let languages = [];

    if (username) {
      try {
        const repos = await getAllRepos(username);
        const counts = {};
        let total = 0;

        repos.forEach((r) => {
          if (r.language) {
            counts[r.language] = (counts[r.language] || 0) + 1;
            total++;
          }
        });

        if (total > 0) {
          languages = Object.entries(counts)
            .map(([name, count]) => ({
              name,
              pct: Math.round((count / total) * 100),
              color: LANG_COLORS[name] || DEFAULT_COLOR
            }))
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 4);
        }
      } catch (err) {
        console.warn('Could not fetch user languages:', err.message);
      }
    }

    // Default fallback stack if no data or no username
    if (languages.length === 0) {
      languages = [
        { name: 'JavaScript', pct: 64, color: '#f1e05a' },
        { name: 'TypeScript', pct: 24, color: '#3178c6' },
        { name: 'HTML', pct: 8, color: '#e34c26' },
        { name: 'CSS', pct: 4, color: '#a855f7' }
      ];
    }

    const width = 850;
    const height = 340;

    const innerX = 34;
    const innerY = 28;
    const innerW = 782;
    const innerH = 264;

    const barTrackX = 330;
    const barTrackW = 440;
    const rowStartY = 132;
    const rowGap = 36;

    const langRows = languages
      .map((item, i) => {
        const y = rowStartY + i * rowGap;
        const fillW = Math.max(10, Math.round((item.pct / 100) * barTrackW));

        return `
    <g class="lang-row" transform="translate(0, 0)">
      <!-- Dot indicator -->
      <circle cx="70" cy="${y - 4}" r="5" fill="${item.color}"/>

      <!-- Language name -->
      <text x="90" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="#ffffff">${escapeXml(item.name)}</text>

      <!-- Percentage value -->
      <text x="290" y="${y}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="700" fill="${item.color}" text-anchor="end">${item.pct}%</text>

      <!-- Horizontal progress bar track -->
      <rect x="${barTrackX}" y="${y - 11}" width="${barTrackW}" height="10" rx="5" fill="${t.track || '#1e293b'}"/>

      <!-- Progress bar fill -->
      <rect x="${barTrackX}" y="${y - 11}" width="${fillW}" height="10" rx="5" fill="${item.color}"/>
    </g>`;
      })
      .join('');

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];
    const titleText = 'Language Stack';
    const subtitleText = 'Repository-weighted technologies';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>Language Stack</title>
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
  <circle cx="200" cy="90" r="140" fill="url(#roamingOrb1)" pointer-events="none">
    <animate attributeName="cx" values="180;680;420;180" dur="16s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="90;130;250;90" dur="16s" repeatCount="indefinite"/>
  </circle>
  <circle cx="640" cy="230" r="130" fill="url(#roamingOrb2)" pointer-events="none">
    <animate attributeName="cx" values="640;220;520;640" dur="20s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="230;250;90;230" dur="20s" repeatCount="indefinite"/>
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
  <text x="60" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="${t.titleText || '#ffffff'}" letter-spacing="-0.4">${titleText}</text>
  <text x="60" y="93" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="${t.subtext || '#94a3b8'}" letter-spacing="0.2">${subtitleText}</text>

  <!-- Terminal scanner status -->
  <text x="780" y="66" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" font-weight="600" fill="#38bdf8" text-anchor="end">&gt; stack.scan <tspan fill="#38bdf8">_</tspan></text>

  <!-- Language Progress Bars -->
  ${langRows}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=1800');
    res.send(svg);
  } catch (err) {
    console.error('languages error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="180" viewBox="0 0 850 180">
        <rect width="850" height="180" rx="16" fill="${t.outerBg || '#070913'}" stroke="#30363d"/>
        <text x="40" y="60" font-family="sans-serif" font-size="22" font-weight="700" fill="#ffffff">Language Stack</text>
        <text x="40" y="95" font-family="sans-serif" font-size="13" fill="#8b949e">Couldn't load language stack</text>
      </svg>`
    );
  }
});

module.exports = router;
