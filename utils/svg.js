const THEMES = {
  'github-dark': {
    bg: '#0d1117',
    border: '#30363d',
    text: '#c9d1d9',
    muted: '#8b949e',
    accent: '#58a6ff',
    green: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
  },
  light: {
    bg: '#ffffff',
    border: '#d0d7de',
    text: '#1f2328',
    muted: '#57606a',
    accent: '#0969da',
    green: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
  },
  aurora: {
    bg: '#0f0b1e',
    border: '#3a2e5c',
    text: '#ece9fb',
    muted: '#a99fd6',
    accent: '#b18cff',
    green: ['#1c1533', '#3d2b70', '#6f4bc9', '#9a6bff', '#c9a8ff']
  },
  cyber: {
    bg: '#020a0a',
    border: '#0f3d3d',
    text: '#c9fdf5',
    muted: '#5fb8ae',
    accent: '#00ffd0',
    green: ['#04120f', '#04352b', '#046a4e', '#00a878', '#00ffd0']
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
