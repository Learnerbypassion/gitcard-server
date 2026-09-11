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
    const [user, repos] = await Promise.all([getUser(username), getAllRepos(username)]);

    let contrib = { total: 0, activeDays: 0 };
    try {
      contrib = await getContributions(username);
    } catch (_) {
      // Contribution scraping is best-effort; card still renders without it.
    }

    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
    const repoCount = user.public_repos ?? repos.length;
    const followers = user.followers ?? 0;

    const metrics = [
      { label: 'Repositories', value: repoCount },
      { label: 'Stars', value: totalStars },
      { label: 'Contributions', value: contrib.total },
      { label: 'Followers', value: followers }
    ];

    const width = 760;
    const height = 150;
    const colWidth = (width - 32) / metrics.length;

    const cols = metrics
      .map((m, i) => {
        const cx = 16 + colWidth * i + colWidth / 2;
        return `
<text x="${cx}" y="78" font-family="ui-monospace, monospace" font-size="30" font-weight="600" fill="${t.text}" text-anchor="middle">${formatNumber(m.value)}</text>
<text x="${cx}" y="102" font-family="sans-serif" font-size="12" fill="${t.muted}" text-anchor="middle">${escapeXml(m.label)}</text>
${i > 0 ? `<line x1="${16 + colWidth * i}" y1="30" x2="${16 + colWidth * i}" y2="${height - 30}" stroke="${t.border}" stroke-width="1"/>` : ''}`;
      })
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<title>${escapeXml(user.name || username)} GitHub proof metrics</title>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
<text x="16" y="26" font-family="sans-serif" font-size="12" fill="${t.accent}">Profile signal</text>
${cols}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=1800');
    res.send(svg);
  } catch (err) {
    console.error('stats error:', err);
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(
      `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80"><rect width="420" height="80" rx="10" fill="${t.bg}" stroke="${t.border}"/><text x="16" y="45" font-family="sans-serif" font-size="13" fill="${t.muted}">Couldn't load stats for "${escapeXml(username)}"</text></svg>`
    );
  }
});

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

module.exports = router;
