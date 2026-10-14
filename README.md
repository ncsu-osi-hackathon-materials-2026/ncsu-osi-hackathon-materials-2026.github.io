# OSI Hackathon @ NC State — 2026

Website for the NC State Materials Science & Engineering on-site hub of the worldwide
[Open Scientific Intelligence (OSI) Hackathon](https://llmhackathon.github.io/), Oct 21–22, 2026, Centennial Campus.

Plain HTML/CSS/JS — no build step. Hosted on GitHub Pages at
**https://ncsu-osi-hackathon-materials-2026.github.io/**

## Updating the site

| What | Where |
|---|---|
| Registration form link, Slack link, event start/end | `assets/js/config.js` |
| Schedule times | `index.html` → `#schedule` (each item's `data-start` / `data-end` drives the "Happening now" marker) |
| Room / building | `index.html` → `#venue` and the "Where exactly is it?" FAQ |
| Tracks & prizes (when announced) | `index.html` → `#build`, the "Tracks & prizes" card |
| Last year's photos | `assets/img/2025-1.jpg`, `assets/img/2025-2.jpg` |
| Social preview image | `assets/img/og-image.png` (source: `tools/og-image.html`) |

While a link in `config.js` is empty, buttons show "Form opens soon" / "Link coming soon"
and the banner scrolls to the How to join section. Paste the link in and every button updates.

## Run locally

```bash
python3 -m http.server 8420
```

Then open http://localhost:8420.

## Deploy to GitHub Pages

1. Create the GitHub organization **ncsu-osi-hackathon-materials-2026** (github.com → Your organizations → New organization → Free).
2. In that org, create a public repo named **ncsu-osi-hackathon-materials-2026.github.io**.
3. Push this folder to the `main` branch.
4. Repo → Settings → Pages → Source: *Deploy from a branch*, Branch: `main` / root.

The site goes live at `https://ncsu-osi-hackathon-materials-2026.github.io/` within a minute or two.

## Re-rendering the social preview image

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars --window-size=1200,630 --virtual-time-budget=4000 --screenshot="$PWD/assets/img/og-image.png" "file://$PWD/tools/og-image.html"
```

Note: social sites need an absolute URL for `og:image`. Once the domain is live, `index.html` uses
`https://ncsu-osi-hackathon-materials-2026.github.io/assets/img/og-image.png`.
