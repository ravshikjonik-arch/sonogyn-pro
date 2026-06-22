# Fetal anatomy atlas

Grayscale PNG placeholders (640×400) for all 24 views — normal + pathology.

Replace with **clinical echogram PNG** — same basename:

- `{viewId}_normal.png`
- `{viewId}_pathology.png`

SVG fallbacks remain for dev; UI prefers PNG.

Generate placeholders:

```bash
cd apps/web && npm run atlas:fetal-anatomy-png
```

Module: `/library/fetal-anatomy-22-views`

Source protocol: Е.С. Емельяненко · 22 среза · 65 ВПР
