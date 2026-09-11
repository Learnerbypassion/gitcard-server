const THEMES = {
  'github-dark': {
    bg: '#0d1117',
    border: '#30363d',
    text: '#c9d1d9',
    muted: '#8b949e',
    accent: '#58a6ff',
    green: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
    outerBg: '#070913',
    cardBg: 'rgba(8, 12, 20, 0.65)',
    tileBg: '#090e18',
    titleText: '#ffffff',
    subtext: '#94a3b8',
    watermark: '#475569',
    track: '#152033',
    borderGradient: ['#38bdf8', '#10b981', '#8b5cf6', '#2563eb'],
    innerBorder: 'rgba(56, 189, 248, 0.2)',
    radarColor: '#10b981',
    radarOpacity: 0.07,
    tiles: {
      stars: { label: 'Stars', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' },
      contributions: { label: 'Contributions', color: '#2dd4bf', border: 'rgba(45, 212, 191, 0.35)' },
      repos: { label: 'Repos', color: '#c084fc', border: 'rgba(192, 132, 252, 0.35)' },
      followers: { label: 'Followers', color: '#4ade80', border: 'rgba(74, 222, 128, 0.35)' }
    }
  },
  light: {
    bg: '#ffffff',
    border: '#d0d7de',
    text: '#1f2328',
    muted: '#57606a',
    accent: '#0969da',
    green: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    outerBg: '#f8fafc',
    cardBg: 'rgba(255, 255, 255, 0.85)',
    tileBg: '#ffffff',
    titleText: '#0f172a',
    subtext: '#64748b',
    watermark: '#94a3b8',
    track: '#e2e8f0',
    borderGradient: ['#0284c7', '#0d9488', '#7c3aed', '#2563eb'],
    innerBorder: 'rgba(148, 163, 184, 0.3)',
    radarColor: '#0d9488',
    radarOpacity: 0.06,
    tiles: {
      stars: { label: 'Stars', color: '#0284c7', border: 'rgba(2, 132, 199, 0.3)' },
      contributions: { label: 'Contributions', color: '#0d9488', border: 'rgba(13, 148, 136, 0.3)' },
      repos: { label: 'Repos', color: '#7c3aed', border: 'rgba(124, 58, 237, 0.3)' },
      followers: { label: 'Followers', color: '#16a34a', border: 'rgba(22, 163, 74, 0.3)' }
    }
  },
  aurora: {
    bg: '#0f0b1e',
    border: '#3a2e5c',
    text: '#ece9fb',
    muted: '#a99fd6',
    accent: '#b18cff',
    green: ['#1c1533', '#3d2b70', '#6f4bc9', '#9a6bff', '#c9a8ff'],
    outerBg: '#0c0818',
    cardBg: 'rgba(15, 11, 30, 0.7)',
    tileBg: '#130d26',
    titleText: '#ffffff',
    subtext: '#b4a7d6',
    watermark: '#67588b',
    track: '#261b4a',
    borderGradient: ['#b18cff', '#ec4899', '#8b5cf6', '#06b6d4'],
    innerBorder: 'rgba(177, 140, 255, 0.2)',
    radarColor: '#b18cff',
    radarOpacity: 0.08,
    tiles: {
      stars: { label: 'Stars', color: '#c084fc', border: 'rgba(192, 132, 252, 0.4)' },
      contributions: { label: 'Contributions', color: '#f472b6', border: 'rgba(244, 114, 182, 0.4)' },
      repos: { label: 'Repos', color: '#818cf8', border: 'rgba(129, 140, 248, 0.4)' },
      followers: { label: 'Followers', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' }
    }
  },
  cyber: {
    bg: '#020a0a',
    border: '#0f3d3d',
    text: '#c9fdf5',
    muted: '#5fb8ae',
    accent: '#00ffd0',
    green: ['#04120f', '#04352b', '#046a4e', '#00a878', '#00ffd0'],
    outerBg: '#020a0a',
    cardBg: 'rgba(3, 16, 16, 0.7)',
    tileBg: '#051818',
    titleText: '#ffffff',
    subtext: '#5fb8ae',
    watermark: '#164e4e',
    track: '#0a3030',
    borderGradient: ['#00ffd0', '#00b4d8', '#7209b7', '#00ffd0'],
    innerBorder: 'rgba(0, 255, 208, 0.2)',
    radarColor: '#00ffd0',
    radarOpacity: 0.08,
    tiles: {
      stars: { label: 'Stars', color: '#00ffd0', border: 'rgba(0, 255, 208, 0.4)' },
      contributions: { label: 'Contributions', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' },
      repos: { label: 'Repos', color: '#a78bfa', border: 'rgba(167, 139, 250, 0.4)' },
      followers: { label: 'Followers', color: '#4ade80', border: 'rgba(74, 222, 128, 0.4)' }
    }
  }
};

function theme(name) {
  return THEMES[name] || THEMES['github-dark'];
}

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function cardFrame({ width, height, t }) {
  return `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>`;
}

module.exports = { theme, escapeXml, cardFrame };
