# Web/PWA Deployment Guide

## Local Web

```bash
npm run web:dev
```

Open `http://localhost:19001`. The root path `/` opens the landing page, and `/app` opens the clinical app shell.

## Production Build

```bash
npm run web:build
```

Expo exports the web app into `dist/`. The project uses `web.output: "single"` because routing is handled by React Navigation, not Expo Router static routes. Deploy `dist/` behind HTTPS.

## PWA

PWA assets live in `public/`:

- `manifest.webmanifest`
- `sw.js`
- `icon-192.png`
- `icon-512.png`
- `apple-touch-icon.png`

The runtime registration is in `src/web/pwa.ts` and is called from `App.tsx` only on web.

## Vercel

`vercel.json` is configured for:

- `npm run web:build`
- static output from `dist`
- service worker headers
- SPA rewrites for deep links such as `/app`, `/case/:id`, `/orads`, `/tirads`

Deploy:

```bash
npx vercel
```

## iPhone Install Flow

1. Open the HTTPS domain in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Launch from the home screen.

The app uses `viewport-fit=cover`, install metadata and the Apple touch icon for native-like iPhone PWA behavior.

## Shared Backend

Use one HTTPS backend for:

- auth
- cases
- AI
- comments

Current Firebase auth/cases/comments are web-compatible. For production AI, do not expose AI vendor keys in `EXPO_PUBLIC_*`; route model calls through a server endpoint with server-side secrets.

Required env:

```bash
EXPO_PUBLIC_CHAT_API_URL=https://api.yourdomain.com
```

## Medical Production Checklist

- Replace `example.com` legal URLs in `src/config/legalUrls.ts`.
- Deploy backend on HTTPS with CORS limited to the web domain.
- Move uploads to durable object storage for production.
- Run Lighthouse PWA audit on iPhone/Android browsers.
- Verify image upload, PDF export, auth, comments and cases on Safari/Chrome.
