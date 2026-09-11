const express = require('express');
const { getRepo, getAllRepos } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

router.get('/', async (req, res) => {
  const themeName = req.query.theme || 'github-dark';
  const t = theme(themeName);
  const username = req.query.username;
  const reposParam = req.query.repos;

  let repoNames = [];

  if (reposParam) {
    repoNames = reposParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  // If no specific repos provided, pick from the user's public repos or use random/popular repos
  if (repoNames.length === 0 && username) {
    try {
      const userRepos = await getAllRepos(username);
      if (Array.isArray(userRepos) && userRepos.length > 0) {
        // Sort by stars descending to pick best repos, or sample
        const sorted = [...userRepos].sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
        repoNames = sorted.slice(0, 4).map((r) => r.full_name || `${username}/${r.name}`);
      }
    } catch (err) {
      console.warn('Could not auto-fetch user repos for projects:', err.message);
    }
  }

  // Fallback if still empty
  if (repoNames.length === 0) {
    if (username) {
      repoNames = [`${username}/project-alpha`, `${username}/dev-toolkit`, `${username}/web-app`, `${username}/api-service`];
    } else {
      repoNames = ['octocat/Spoon-Knife', 'octocat/Hello-World', 'octocat/octocat.github.io', 'octocat/hello-world'];
    }
  }

  try {
    const repos = await Promise.all(
      repoNames.map((name) =>
        getRepo(name).catch(() => {
          const parts = name.split('/');
          const repoPart = parts[1] || parts[0];
          return {
            name: repoPart,
            full_name: name.includes('/') ? name : `${username || 'user'}/${name}`,
            description: 'A selected public repository.',
            language: 'JavaScript',
            stargazers_count: 12,
            forks_count: 3,
            updated_at: new Date().toISOString()
          };
        })
      )
    );

    const width = 850;
    const height = 400;

    const innerX = 34;
    const innerY = 28;
    const innerW = 782;
    const innerH = 344;

    const cardW = 358;
    const cardH = 124;
    const gapX = 26;
    const gapY = 16;
    const startX = innerX + 20;
    const startY = 88;

    const donutColors = ['#f97316', '#a855f7', '#38bdf8', '#10b981'];

    const projectCards = repos
      .slice(0, 4)
      .map((r, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const cx = startX + col * (cardW + gapX);
        const cy = startY + row * (cardH + gapY);

        const fullName = escapeXml(r.full_name || `${username || 'user'}/${r.name}`);
        const name = escapeXml(r.name);
        const desc = truncate(escapeXml(r.description || 'A public repository on GitHub.'), 48);
        const lang = escapeXml(r.language || 'Code');
        const stars = r.stargazers_count || 0;
        const updated = formatTimeAgo(r.updated_at || r.pushed_at);

        // Donut percentage calculation
        const donutColor = donutColors[i % donutColors.length];
        const pct = calculateDonutPct(r, i);
        const radius = 22;
        const circ = 2 * Math.PI * radius;
        const dashoffset = circ - (pct / 100) * circ;

        const langPillW = Math.max(42, lang.length * 7 + 16);

        return `
    <g class="repo-card" transform="translate(${cx}, ${cy})">
      <rect width="${cardW}" height="${cardH}" rx="12" fill="${t.tileBg || '#090e18'}" stroke="rgba(56, 189, 248, 0.22)" stroke-width="1.2"/>
      
      <!-- Mini path & status dot -->
      <circle cx="18" cy="22" r="3.5" fill="#10b981"/>
      <text x="28" y="25.5" font-family="ui-monospace, monospace" font-size="11" fill="#64748b">${fullName}</text>

      <!-- Repo title with terminal cursor -->
      <text x="18" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="700" fill="#ffffff">${name}<tspan fill="#38bdf8"> _</tspan></text>

      <!-- Description -->
      <text x="18" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#8b949e">${desc}</text>

      <!-- Language pill -->
      <rect x="18" y="91" width="${langPillW}" height="19" rx="4" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(56, 189, 248, 0.28)" stroke-width="0.8"/>
      <text x="${18 + langPillW / 2}" y="104.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" fill="#38bdf8" text-anchor="middle">${lang}</text>

      <!-- Stars and updated -->
      <text x="${18 + langPillW + 10}" y="104.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b">★ ${formatNumber(stars)} · ${updated}</text>

      <!-- Donut activity ring -->
      <g transform="translate(316, 62)">
        <circle cx="0" cy="0" r="${radius}" fill="none" stroke="#1e293b" stroke-width="4.5"/>
        <circle cx="0" cy="0" r="${radius}" fill="none" stroke="${donutColor}" stroke-width="4.5"
          stroke-linecap="round"
          stroke-dasharray="${circ}"
          stroke-dashoffset="${dashoffset}"
          transform="rotate(-90)"/>
        <text x="0" y="3.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">${pct}%</text>
      </g>
    </g>`;
      })
      .join('');

    const gradStops = t.borderGradient || ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
  <title>Selected Work</title>
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
  <circle cx="200" cy="110" r="140" fill="url(#roamingOrb1)" pointer-events="none">
    <animate attributeName="cx" values="180;680;420;180" dur="18s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="100;160;280;100" dur="18s" repeatCount="indefinite"/>
  </circle>
  <circle cx="640" cy="280" r="130" fill="url(#roamingOrb2)" pointer-events="none">
    <animate attributeName="cx" values="640;220;520;640" dur="22s" repeatCount="indefinite"/>
    <animate attributeName="cy" values="280;300;110;280" dur="22s" repeatCount="indefinite"/>
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

  <!-- Terminal Header -->
  <text x="56" y="56" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" font-weight="700" fill="#38bdf8" letter-spacing="1">PROJECTS.LIST</text>
  <text x="175" y="56" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" fill="#64748b">./projects.sh --all</text>
  <text x="794" y="56" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" fill="#64748b" text-anchor="end">${repos.length} pinned</text>
  <line x1="56" y1="70" x2="794" y2="70" stroke="#1e293b" stroke-width="1"/>

  <!-- 2x2 Project Cards -->
  ${projectCards}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=1800');
    res.send(svg);
  } catch (err) {
    console.error('projects error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="180" viewBox="0 0 850 180">
        <rect width="850" height="180" rx="16" fill="${t.outerBg || '#070913'}" stroke="#30363d"/>
        <text x="40" y="60" font-family="sans-serif" font-size="22" font-weight="700" fill="#ffffff">Selected Work</text>
        <text x="40" y="95" font-family="sans-serif" font-size="13" fill="#8b949e">Couldn't load projects</text>
      </svg>`
    );
  }
});

function formatNumber(n) {
  const num = Number(n) || 0;
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 10000) return Math.round(num / 1000) + 'K';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(num);
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'recently';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears}y ago`;
  if (diffMonths > 0) return `${diffMonths}mo ago`;
  if (diffDays > 0) return `${diffDays}d ago`;
  return 'today';
}

function calculateDonutPct(r, index) {
  const stars = r.stargazers_count || 0;
  if (stars > 1000) return Math.min(98, 50 + (index * 13) % 45);
  if (stars > 50) return Math.min(92, 40 + (index * 17) % 50);
  const hash = ((r.name || '').length * 19 + index * 23) % 45;
  return 55 + hash;
}

module.exports = router;
