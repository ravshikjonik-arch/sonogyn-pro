# Session & Client Storage Audit

**Дата:** 2026-09-10

## Auth architecture

- Supabase Auth (SSR cookies via `@/utils/supabase/server`)
- Middleware session refresh — `apps/web/middleware.ts`
- Mobile: Supabase session + SecureStore patterns (partial)

## Web storage inventory

| Key / prefix | Storage | Clinical? | Wiped on logout? | File |
|--------------|---------|-----------|------------------|------|
| `protocol-draft-*` | localStorage | Yes (encrypted) | ✅ | `UltrasoundProtocolForm.tsx` |
| `sonogyn-structured-editor:*` | localStorage | Yes (plain JSON) | ✅ | `autosave-storage.ts` |
| `nosology:notes:*` | localStorage | Possible | ✅ | `wipe-clinical-local.ts` |
| `sonogyn_session_anchor_v1` | localStorage | Session meta | ❌ | `session-anchor.ts` |
| Calculator pending bridges | sessionStorage | Calc results only | Partial | `calculator-bridge.ts` |
| Theme, locale, education progress | localStorage | No | ❌ | various |

## Wipe implementation

`apps/web/lib/security/wipe-clinical-local.ts` — вызывается из:

- `logout-button.tsx`
- `useSessionRevalidation.ts`
- `clinical-shell.tsx`
- `profile-settings-form.tsx`

## Требования vs факт

| Требование | Статус |
|------------|--------|
| Медданные не в localStorage | ⚠️ Structured editor autosave — recovery only, wiped on logout |
| Service role не в bundle | ✅ |
| Secure cookies | ✅ Supabase defaults |
| Logout clears clinical local | ✅ partial |
| Mobile SecureStore for tokens | ⚠️ verify per-screen |

## Рекомендации (этап 2)

1. Encrypt structured editor autosave (parity с protocol form)
2. Clear `sonogyn_session_anchor_v1` on logout
3. TTL на recovery blobs (e.g. 72h)
4. Audit mobile AsyncStorage keys
5. Document «recovery blob ≠ source of truth» — Supabase is canonical

## Запрещено

- Хранить JWT/refresh token в localStorage
- Persist patient PHI in client storage
- Custom crypto — use existing `encryptJson` utilities
