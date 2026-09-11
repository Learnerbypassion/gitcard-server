async function check() {
  const res = await fetch('https://github.com/Learnerbypassion?tab=repositories', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const html = await res.text();
  const counters = [...html.matchAll(/data-tab-item="repositories"[\s\S]*?class="Counter"[^>]*>(\d+)<\/span>/g)];
  if (counters.length > 0) {
    console.log('Repositories tab counter:', counters[0][1]);
  } else {
    const anyCounters = [...html.matchAll(/class="Counter"[^>]*>(\d+)<\/span>/g)];
    console.log('Any counters:', anyCounters.map(c => c[1]));
  }

  // Also check all repo names listed on the tab
  const repoMatches = [...html.matchAll(/itemprop="name codeRepository"[^>]*>\s*([^\s<]+)/g)];
  console.log('Found repos on page 1:', repoMatches.length);
}

check();
