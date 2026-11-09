# Kyaw Zay Ya Hein — Portfolio

Personal portfolio site. Pure static HTML/CSS/JS — no build step, no dependencies.

## Preview locally

Open `index.html` directly in a browser, or serve it:

```bash
python -m http.server 8000
# → http://localhost:8000
```

## Deploy (free) — GitHub Pages

```bash
cd portfolio
git init
git add .
git commit -m "Portfolio v1"
git branch -M main
git remote add origin https://github.com/KyawZayYaHein/portfolio.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: main branch, / (root)**.
Site goes live at `https://kyawzayyahein.github.io/portfolio/`.

(Alternative: drag the folder into vercel.com or netlify.com for a nicer URL.)

## Structure

- `index.html` — everything: hero, skills, 3 case studies, process, contact
- `styles.css` — design tokens at the top (`:root`) control the whole theme
- `assets/` — optimized project screenshots (Memoora, Baganetic web, Baganetic mobile)

## Design language — "Dream Gradient"

Derived from the Memoora design system: lavender→sky gradients
(#4a44c6 / #a8d8ff / #f7c8e8), Fraunces + Nunito, pill geometry, soft shadows.
Each case card gets its own tinted world: lavender (Memoora), warm sand
(Baganetic web), and heritage cream (the current Baganetic Mobile build).
