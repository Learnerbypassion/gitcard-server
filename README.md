# gitcard-server

Your own self-hosted GitHub profile card API — high-tech, glowing SVG proof cards for your GitHub profile and READMEs, running on infrastructure you control, with no login wall and no risk of a broken camo cache.

## Endpoints

```
GET /api/section/portrait?username=<user>&theme=<theme>
GET /api/section/stats?username=<user>&theme=<theme>
GET /api/section/projects?username=<user>&theme=<theme>&repos=owner/repo,owner/repo2
GET /api/section/languages?username=<user>&theme=<theme>
```

Themes: `github-dark` (default), `light`, `aurora`, `cyber`.

All return `image/svg+xml` and are safe to hotlink directly in a README, e.g.:

```md
![Stats](https://YOUR-APP.onrender.com/api/section/stats?username=learnerbypassion&theme=github-dark)
![Projects](https://YOUR-APP.onrender.com/api/section/projects?username=learnerbypassion&theme=github-dark)
![Languages](https://YOUR-APP.onrender.com/api/section/languages?username=learnerbypassion&theme=github-dark)
```

## How it works

- **stats** — renders "Profile Signal" with live metrics (stars, contributions, repos, followers) featuring multi-stop glowing border gradients, ambient aura lighting, and animated roaming glowing orbs.
- **projects** — renders "Selected Work" in a terminal list 2x2 grid with language pills, star counts, time-ago stamps, and circular donut activity badges. You can select specific repositories via `repos=`, or leave it blank to automatically showcase top public repositories.
- **languages** — renders "Language Stack" / technical toolkit with repository-weighted language percentages and colored horizontal progress bars.
- **portrait** — downloads the user's GitHub avatar, converts it to a terminal-style ASCII grid with Jimp, and renders it as an SVG ASCII portrait.

Responses are cached in-memory for 10 minutes per query to avoid hitting GitHub's rate limit on every README view.

## Run locally

```bash
npm install
npm start
# -> http://localhost:3000
```

## Deploy to Render

1. Push this folder to a new GitHub repo (e.g. `gitcard-server`).
2. On [render.com](https://render.com), click **New > Web Service**, connect the repo. Render will detect `render.yaml` automatically — or set it up manually with:
   - Build command: `npm install`
   - Start command: `npm start`
3. **Strongly recommended:** in Render's environment variables, add `GITHUB_TOKEN` with a [personal access token](https://github.com/settings/tokens) (no scopes needed, just "public repo" read access). This raises your GitHub API rate limit from 60 requests/hour to 5,000/hour — without it, a busy README (viewed by many people) can exhaust the limit quickly.
4. Once deployed, your endpoint base is `https://YOUR-APP.onrender.com`.
   Swap that into your README's image URLs.

Note: Render's free tier spins down after 15 minutes of inactivity, so the
first image load after a quiet period will take a few seconds while it
wakes up. Subsequent loads are fast (and cached for 10 minutes).
