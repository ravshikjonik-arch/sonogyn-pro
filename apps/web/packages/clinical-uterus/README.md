# @clinical/uterus

Shared **React Three Fiber** uterus anatomy / FIGO teaching scene (ported from `us-risk-calc`).

**Path:** `medical-ultrasound-next/packages/clinical-uterus` (kept inside the Next.js project root so Turbopack resolves `@clinical/uterus` without escaping the app boundary).

## Consumers

- **`medical-ultrasound-next`** — `@clinical/uterus` via `file:./packages/clinical-uterus`, `transpilePackages`, and `tsconfig` paths.
- **`us-risk-calc` (Expo)** — copy this folder or point Metro `watchFolders` here and map `@clinical/uterus` in `metro.config.js`.

## Peer dependencies

`react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`.

## Exports

`ProceduralUterus`, workspace types, FIGO hit helpers, profile & geometry builders.
