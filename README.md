# Holy Cannoli
Arcade coin-catcher style mini-game (but with pastries 🥐) – built with Vite + React + TypeScript + Tailwind.

## Local dev
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy (Netlify - easiest)
1. Push this folder to a GitHub repo.
2. In Netlify: **New site from Git**, connect to that repo.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy.

## Deploy (GitHub Pages via Netlify/GitHub Actions)
- Netlify recommended for SPA + custom headers; GH Pages works but needs extra config for SPA routes.
