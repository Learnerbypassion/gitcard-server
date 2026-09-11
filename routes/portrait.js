const express = require('express');
const Jimp = require('jimp');
const { getUser } = require('../utils/github');
const { theme, escapeXml } = require('../utils/svg');

const router = express.Router();

// Density ramp: sparsest -> densest glyph, mapped from pixel brightness.
const RAMP = ' .\'`^",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

const COLS = 54;
const ROWS = 30; // shorter than COLS since monospace glyphs are taller than wide

router.get('/', async (req, res) => {
  const username = req.query.username;
  const themeName = req.query.theme || 'github-dark';
  if (!username) return res.status(400).send('username query param is required');

  const t = theme(themeName);

  try {
    const user = await getUser(username);
    const avatarUrl = user.avatar_url || `https://github.com/${username}.png`;

    const image = await Jimp.read(avatarUrl);
    image.resize(COLS, ROWS).greyscale();

    const rows = [];
    for (let y = 0; y < ROWS; y++) {
      let row = '';
      for (let x = 0; x < COLS; x++) {
        const idx = image.getPixelIndex(x, y);
        const brightness = image.bitmap.data[idx]; // greyscale: R=G=B
        const rampIdx = Math.floor((brightness / 255) * (RAMP.length - 1));
        row += RAMP[rampIdx];
      }
      rows.push(row);
    }

    const charW = 6.2;
    const charH = 11;
    const padX = 16;
    const padY = 16;
    const width = Math.round(COLS * charW + padX * 2);
    const height = Math.round(ROWS * charH + padY * 2 + 26);

    const textRows = rows
      .map((row, i) => {
        return `<text x="${padX}" y="${padY + 22 + i * charH}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="9" fill="${t.accent}" xml:space="preserve">${escapeXml(row)}</text>`;
      })
      .join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
<title>${escapeXml(user.name || username)} ASCII portrait</title>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${t.bg}" stroke="${t.border}" stroke-width="1"/>
<circle cx="${padX + 6}" cy="${padY}" r="4" fill="#ff5f56"/>
<circle cx="${padX + 20}" cy="${padY}" r="4" fill="#ffbd2e"/>
<circle cx="${padX + 34}" cy="${padY}" r="4" fill="#27c93f"/>
<text x="${padX + 48}" y="${padY + 4}" font-family="ui-monospace, monospace" font-size="10" fill="${t.muted}">${escapeXml(username)}@github</text>
${textRows}
</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=1800');
    res.send(svg);
  } catch (err) {
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(errorSvg(t, `Couldn't render portrait for "${username}"`));
  }
});

function errorSvg(t, message) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80" viewBox="0 0 420 80">
<rect width="420" height="80" rx="10" fill="${t.bg}" stroke="${t.border}"/>
<text x="16" y="45" font-family="sans-serif" font-size="13" fill="${t.muted}">${message.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
</svg>`;
}

module.exports = router;
