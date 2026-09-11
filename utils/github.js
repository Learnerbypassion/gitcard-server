const GH_API = 'https://api.github.com';

// Basic in-memory cache so repeated README image requests don't hammer
// GitHub's API (and don't blow through the unauthenticated rate limit).
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_TTL_MS) return hit.value;
  const value = await fn();
  cache.set(key, { value, time: Date.now() });
  return value;
}

function ghHeaders() {
  const headers = { 'User-Agent': 'gitcard-server' };
  // Optional: set GITHUB_TOKEN in your Render environment to raise the
  // rate limit from 60/hr to 5000/hr. Not required to run the service.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function getUser(username) {
  return cached(`user:${username}`, async () => {
    const res = await fetch(`${GH_API}/users/${username}`, { headers: ghHeaders() });
    if (!res.ok) throw new Error(`GitHub user lookup failed (${res.status})`);
    return res.json();
  });
}

async function getAllRepos(username) {
  return cached(`repos:${username}`, async () => {
    const repos = [];
    let page = 1;
    while (true) {
      const res = await fetch(
        `${GH_API}/users/${username}/repos?per_page=100&page=${page}`,
        { headers: ghHeaders() }
      );
      if (!res.ok) {
        if (page > 1) break;
        throw new Error(`GitHub repo list failed (${res.status})`);
      }
      const batch = await res.json();
      if (!Array.isArray(batch)) break;
      repos.push(...batch);
      if (batch.length < 100) break;
      page += 1;
      if (page > 10) break; // safety cap
    }
    return repos;
  });
}

async function getRepo(fullName) {
  return cached(`repo:${fullName}`, async () => {
    const res = await fetch(`${GH_API}/repos/${fullName}`, { headers: ghHeaders() });
    if (!res.ok) throw new Error(`GitHub repo lookup failed for ${fullName} (${res.status})`);
    return res.json();
  });
}

// GitHub doesn't expose total contributions / streak data via the public
// REST API. The public contribution calendar SVG on a user's profile page
// is the only unauthenticated source, so we scrape and parse it.
async function getContributions(username) {
  return cached(`contrib:${username}`, async () => {
    const res = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: { 'User-Agent': 'gitcard-server' }
    });
    if (!res.ok) throw new Error(`Contribution graph fetch failed (${res.status})`);
    const html = await res.text();

    const dayRegex = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
    let match;
    let total = 0;
    let activeDays = 0;
    const countRegex = /<tool-tip[^>]*for="[^"]+"[^>]*>([\d,]+) contributions?/g;

    // Newer GitHub markup embeds counts as tooltips keyed by cell id, and
    // levels on the <td> cells themselves. We reconcile both shapes below
    // for resilience against markup changes.
    const levelByDate = {};
    while ((match = dayRegex.exec(html)) !== null) {
      levelByDate[match[1]] = Number(match[2]);
      activeDays += Number(match[2]) > 0 ? 1 : 0;
    }

    const countMatches = [...html.matchAll(/data-date="(\d{4}-\d{2}-\d{2})"[^>]*>\s*<\/td>/g)];

    // Sum via the "N contributions on <date>" tooltip text which GitHub
    // renders adjacent to each cell.
    const tooltipRegex = /(\d[\d,]*)\s+contributions?\s+on\s+[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/g;
    let tMatch;
    let tooltipTotal = 0;
    let foundTooltips = false;
    while ((tMatch = tooltipRegex.exec(html)) !== null) {
      tooltipTotal += Number(tMatch[1].replace(/,/g, ''));
      foundTooltips = true;
    }
    if (foundTooltips) total = tooltipTotal;

    const totalHeaderMatch = html.match(/([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/);
    if (totalHeaderMatch) {
      total = Number(totalHeaderMatch[1].replace(/,/g, ''));
    }

    return { total, activeDays, levelByDate };
  });
}

module.exports = { getUser, getAllRepos, getRepo, getContributions };
