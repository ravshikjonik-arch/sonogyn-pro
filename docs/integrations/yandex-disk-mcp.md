# Яндекс.Диск → Cursor (MCP)

Чтобы агент читал/качал файлы с Диска напрямую (справки, PDF, чеклисты).

Пакет: [`yandex-disk-mcp`](https://www.npmjs.com/package/yandex-disk-mcp) (OAuth-токен).

## 1. OAuth-приложение (один раз, ~5 мин)

1. Откройте https://oauth.yandex.ru/client/new  
2. Создайте приложение (платформа: **Веб-сервисы**).  
3. Redirect URI: `https://oauth.yandex.ru/verification_code`  
4. Права (достаточно для работы агента):
   - `cloud_api:disk.read`
   - `cloud_api:disk.write` (если нужно заливать файлы; иначе только read + info)
   - `cloud_api:disk.info`
5. Сохраните → скопируйте **ClientID**.

## 2. Токен

В браузере (подставьте свой ClientID):

```
https://oauth.yandex.ru/authorize?response_type=token&client_id=ВАШ_CLIENT_ID
```

Разрешите доступ → скопируйте `access_token` из адресной строки (после `#access_token=`).

**Не коммитьте токен в git.** Не кладите токен в plaintext JSON.

Хранение (рекомендуется):

```bash
mkdir -p ~/.cursor/secrets && chmod 700 ~/.cursor/secrets
printf 'YANDEX_DISK_TOKEN=%s\n' 'ВАШ_ТОКЕН' > ~/.cursor/secrets/yandex-disk.env
chmod 600 ~/.cursor/secrets/yandex-disk.env
```

## 3. Конфиг Cursor

В `~/.cursor/mcp.json` (пользовательский, не репозиторий) — только `envFile`, без токена в JSON:

```json
{
  "mcpServers": {
    "yandex-disk": {
      "command": "npx",
      "args": ["-y", "yandex-disk-mcp"],
      "envFile": "/Users/ВАШ_USER/.cursor/secrets/yandex-disk.env"
    }
  }
}
```

После смены токена перезапустите MCP в Cursor. Не присылайте токен в чат.

## 4. Проверка

После перезагрузки MCP:

- «Покажи свободное место на Яндекс.Диске»
- «Список файлов в /»  
- «Скачай /path/to/file.pdf в Downloads»

## Безопасность

- Токен = полный доступ к Диску в рамках прав приложения.  
- Не кладите токен в `.cursor/mcp.json` репозитория SonoGyn (файл в git).  
- Для меддокументов / ПДн — отдельная папка на Диске и осторожность в чате.
