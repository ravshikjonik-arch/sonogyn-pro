# Upload Security — Medical Images & Files

**Дата:** 2026-09-10

## Implemented

| Control | Location |
|---------|----------|
| Magic bytes validation | `packages/upload-validation/src/index.ts` |
| Web file validation | `apps/web/lib/security/file-validation.ts` |
| Case media API | `apps/web/app/api/cases/[caseId]/media/route.ts` |
| Copilot register | `apps/web/app/api/copilot/images/register/route.ts` |
| Mobile upload | `apps/mobile/src/services/firebase/casesService.ts` |
| Size limits | Per-route constants |
| UUID storage keys | Supabase Storage paths |
| Anonymization checklist | `anonymization-gate.ts` |
| Publish gate (R6) | `POST .../publish` blocks if media not passed |

## Allowed formats (typical)

PNG, JPEG, WebP, GIF, DICOM (context), MP4/WebM (video attachments).

## EXIF / metadata strip (implemented 2026-09-10)

| Control | Location |
|---------|----------|
| Server-side re-encode without metadata | `apps/web/lib/security/strip-image-metadata.ts` |
| Wired on case media upload | `apps/web/app/api/cases/[caseId]/media/route.ts` |

Formats: JPEG, PNG, WebP. DICOM/video unchanged.

## Not implemented

| Control | Priority |
|---------|----------|
| EXIF on mobile Firebase upload | Med |
| DICOM tag PHI scrub | High |
| Server re-encode | Med |
| OCR burned-in PHI detection | Low (manual checklist today) |
| Executable blocklist beyond magic bytes | Med |

## User-facing warning

При публикации кейса врач должен видеть:

> Текст и метки на самом изображении (ФИО, ID исследования) автоматически не удаляются. Проверьте обезличивание перед публикацией.

## Recommended pipeline (этап 2)

```
Upload → magic bytes → size check → [strip EXIF] → store UUID key → anonymization checklist → publish gate
```

Use `sharp` or equivalent server-side — **не** in client bundle for clinical uploads.

## Audit

Log upload events via `clinical_platform_audit_events` (action: `attachment.upload`) — без base64/content.

## Tests

- `packages/upload-validation/src/index.test.ts`
- Extend with oversize + unsupported MIME cases in `test:security`
