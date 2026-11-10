# Open guideline text (local only)

Полные тексты КР сюда **не коммитим** (copyright).

Положите `.txt` рядом (имена из каталога в `apps/web/scripts/seed-open-guidelines-from-url.mjs`), затем:

```bash
node --env-file=apps/web/.env.local apps/web/scripts/seed-open-guidelines-from-url.mjs --apply --publish
```

Если файла нет — скрипт попытается скачать PDF по `external_url`.
