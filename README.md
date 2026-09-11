# gitcard-server

Your own self-hosted GitHub profile card API — same endpoint shape as the
GitSkins preview API, but running on infrastructure you control, with no
login wall and no risk of a broken camo cache.

## Endpoints

```
GET /api/section/portrait?username=<user>&theme=<theme>
GET /api/section/stats?username=<user>&theme=<theme>
GET /api/section/projects?username=<user>&theme=<theme>&repos=owner/repo,owner/repo2
```

Themes: `github-dark` (default), `light`, `aurora`, `cyber`.

All three return `image/svg+xml` and are safe to hotlink directly in a
README, e.g.:

```md
![Portrait](https://YOUR-APP.onrender.com/api/section/portrait?username=learnerbypassion&theme=github-dark)
![Stats](https://YOUR-APP.onrender.com/api/section/stats?username=learnerbypassion&theme=github-dark)
![Projects](https://YOUR-APP.onrender.com/api/section/projects?username=learnerbypassion&theme=github-dark&repos=Learnerbypassion/Employee-Management-System,Learnerbypassion/flappyBirds,Learnerbypassion/Legal-Guardian,Learnerbypassion/SangeetListener)
```

## How it works

- **portrait** — downloads the user's GitHub avatar, converts it to a
  terminal-style ASCII grid with [Jimp](https://github.com/jimp-dev/jimp)
  (pure JS, no native deps), renders it as SVG `<text>`.
- **stats** — calls the public GitHub REST API for repo/follower counts,
  sums stars across all owned repos, and scrapes the public contribution
  calendar (`github.com/users/<user>/contributions`) for total
  contributions, since that data isn't in the public REST API.
- **projects** — looks up each `owner/repo` passed in `repos=` via the
  REST API and renders a card grid with language + star count.

Responses are cached in-memory for 10 minutes per query to avoid hitting
GitHub's rate limit on every README view.

## Run locally

```bash
npm install
npm start
# -> http://localhost:3000
```

## Deploy to Render

1. Push this folder to a new GitHub repo (e.g. `gitcard-server`).
2. On [render.com](https://render.com), click **New > Web Service**, connect
   the repo. Render will detect `render.yaml` automatically — or set it up
   manually with:
   - Build command: `npm install`
   - Start command: `npm start`
3. **Strongly recommended:** in Render's environment variables, add
   `GITHUB_TOKEN` with a
   [personal access token](https://github.com/settings/tokens) (no scopes
   needed, just "public repo" read access). This raises your GitHub API
   rate limit from 60 requests/hour to 5,000/hour — without it, a busy
   README (viewed by many people) can exhaust the limit quickly.
4. Once deployed, your endpoint base is `https://YOUR-APP.onrender.com`.
   Swap that in for `https://www.gitskins.com` in your README's image URLs.

Note: Render's free tier spins down after 15 minutes of inactivity, so the
first image load after a quiet period will take a few seconds while it
wakes up. Subsequent loads are fast (and cached for 10 minutes).
