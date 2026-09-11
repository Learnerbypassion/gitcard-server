const express = require('express');
const { getRepo } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

router.get('/', async (req, res) => {
  const themeName = req.query.theme || 'github-dark';
  const t = theme(themeName);
  const reposParam = req.query.repos;

  if (!reposParam) return res.status(400).send('repos query param is required (comma-separated owner/repo list)');

  const repoNames = reposParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 6);

  try {
    const repos = await Promise.all(
      repoNames.map((name) =>
        getRepo(name).catch(() => ({ name: name.split('/')[1] || name, description: null, language: null, stargazers_count: 0, fork: false }))
      )
    );

    const cardW = 240;
    const cardH = 110;
    const gap = 16;
    const perRow = repos.length <= 2 ? repos.length : 3;
    const rows = Math.ceil(repos.length / perRow);
    const width = perRow * cardW + (perRow + 1) * gap;
    const height = rows * cardH + (rows + 1) * gap;

    const cards = repos
      .map((r, i) => {
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        const x = gap + col * (cardW + gap);
        const y = gap + row * (cardH + gap);
        const name = escapeXml(r.name || repoNames[i]);
        const desc = truncate(escapeXml(r.description || 'A public project.'), 52);
        const lang = escapeXml(r.language || '');
        const stars = r.stargazers_count || 0;

        return `
<g transform="translate(${x},${y})">
  <rect width="${cardW}" height="${cardH}" rx="8" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
  <text x="16" y="26" font-family="sans-serif" font-size="14" font-weight="600" fill="${t.accent}">${name}</text>
  <text x="16" y="48" font-family="sans-serif" font-size="11" fill="${t.muted}">${desc}</text>
  ${lang ? `<circle cx="20" cy="${cardH - 18}" r="4" fill="${t.accent}"/><text x="30" y="${cardH - 14}" font-family="sans-serif" font-size="11" fill="${t.muted}">${lang}</text>` : ''}
  <text x="${cardW - 16}" y="${cardH - 14}" font-family="sans-serif" font-size="11" fill="${t.muted}" text-anchor="end">★ ${stars}</text>
</g>`;
      })
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<title>Selected projects</title>
<rect x="0" y="0" width="${width}" height="${height}" fill="transparent"/>
${cards}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=1800');
    res.send(svg);
  } catch (err) {
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80"><rect width="420" height="80" rx="10" fill="${t.bg}" stroke="${t.border}"/><text x="16" y="45" font-family="sans-serif" font-size="13" fill="${t.muted}">Couldn't load projects</text></svg>`
    );
  }
});

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

module.exports = router;
