# Colibri 24/7 на VPS (без Mac) + Vercel / Supabase

**Цель:** AI (Colibri) всегда доступен; **Vercel** и **Supabase** не переносим.  
**Не юридическая консультация:** в промпты — **без ПДн пациентов** до схемы с юристом (152‑ФЗ).

---

## Схема (как это работает)

```text
Телефон / браузер
       │
       ▼
  Vercel (Next.js API)  ──► Supabase (auth, данные)
       │
       │  gateway: colibri → openrouter → perplexity
       ▼
  HTTPS llm.<ваш-домен>  (VPS: Caddy + coli serve)
```

**Важно:** Vercel **не видит** Tailscale. Для prod нужен **публичный HTTPS** на VPS (или **Cloudflare Tunnel** на стабильный hostname) + **длинный API key**.

---

## Шаг 0 — Выбор VPS (рекомендация)

| Тариф | RAM | Зачем | Ориентир |
|-------|-----|-------|----------|
| **Hetzner CPX41** | 16 GB | `qwen36-35b` tight / нормальный Colibri | ~€15–20/мес |
| **Hetzner CPX31** | 8 GB | только **малая** GGUF / tight MoE | ~€10/мес |
| **Selectel / Yandex** 16 GB | 16 GB | то же + РФ-юрисдикция | по прайсу |

**AWS Lightsail 8 GB** — ок, если уже есть AWS; по смыслу то же, что VPS.

**Диск:** ≥ **100 GB** (модель ~23 GB + OS).

---

## Шаг 1 — Сервер (один раз)

1. Ubuntu **24.04** LTS.
2. SSH-ключ, отключить парольный root-login.
3. Firewall:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

4. (Опционально) **Tailscale** только для **твоего** SSH/админки — не для Vercel.

---

## Шаг 2 — Colibri на VPS

```bash
sudo apt update && sudo apt install -y git python3 build-essential libgomp1 curl

# отдельный пользователь
sudo useradd -m -s /bin/bash colibri
sudo su - colibri

git clone https://github.com/JustVugg/colibri.git
cd colibri
./start-here.sh --yes --model qwen36-35b   # на 16 GB; на 8 GB — другая модель после coli plan
```

Дождаться **скачивания модели** и `coli status` → server running, `http://127.0.0.1:8000/v1`.

Проверка:

```bash
curl -s http://127.0.0.1:8000/v1/models | head -c 400
```

**Порт:** SonoGyn ждёт **8000** (не 5000 из docker-compose по умолчанию).

---

## Шаг 3 — systemd (автозапуск после reboot)

Файл `/etc/systemd/system/colibri.service` (от root):

```ini
[Unit]
Description=Colibri OpenAI sidecar
After=network-online.target

[Service]
Type=simple
User=colibri
WorkingDirectory=/home/colibri/colibri
Environment=HOME=/home/colibri
ExecStart=/usr/bin/python3 /home/colibri/colibri/c/coli start
ExecStop=/usr/bin/python3 /home/colibri/colibri/c/coli stop
Restart=on-failure
RestartSec=15

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now colibri.service
```

Если `coli start` не демонизируется как нужно — заменить на `coli serve --host 127.0.0.1 --port 8000` (см. `coli serve --help` на сервере).

---

## Шаг 4 — Caddy (HTTPS для Vercel)

DNS: `llm.sonogyn-pro.ru` (или поддомен) → **A** на IP VPS.

`/etc/caddy/Caddyfile`:

```caddy
llm.sonogyn-pro.ru {
    reverse_proxy 127.0.0.1:8000
}
```

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
# см. официальную инструкцию Caddy для Ubuntu 24.04
sudo systemctl reload caddy
```

**API key:** Colibri принимает Bearer — задай сильный ключ в env Colibri (см. upstream docs / `COLIBRI_API_KEY` на стороне SonoGyn).

Проверка снаружи:

```bash
curl -s -H "Authorization: Bearer ВАШ_КЛЮЧ" https://llm.sonogyn-pro.ru/v1/models
```

---

## Шаг 5 — Vercel (подключение платформы)

**Только после** успешного curl снаружи.

Vercel → Project `sonogyn-pro-web` → **Environment Variables** (Production + Preview):

| Key | Значение |
|-----|----------|
| `COLIBRI_ENABLED` | `true` |
| `COLIBRI_BASE_URL` | `https://llm.sonogyn-pro.ru/v1` |
| `COLIBRI_MODEL` | id из `/v1/models` (например модель из setup) |
| `COLIBRI_API_KEY` | тот же Bearer |
| `LLM_PROVIDER` | `auto` |
| `LLM_FALLBACK_ORDER` | `colibri,openrouter,perplexity` |

**Оставить** `OPENROUTER_*` / `PERPLEXITY_*` — если Colibri down или **timeout 15s**, уйдёт в cloud (`provider-failover.ts`).

**Redeploy** Production.

Проверка:

```text
GET https://<ваш-vercel>/api/ai/gateway/status?purpose=evidence
```

`colibri.healthy: true`.

Локально из monorepo (опционально):

```bash
COLIBRI_BASE_URL=https://llm.sonogyn-pro.ru/v1 pnpm colibri:check
```

---

## Шаг 6 — Мобильное / web

Менять **не нужно**: приложение бьёт **Vercel API**, не VPS напрямую.

---

## Эксплуатация

| Действие | Команда |
|----------|---------|
| Статус | `sudo -u colibri colibri/c/coli status` |
| Логи | `journalctl -u colibri -f` |
| Обновление Colibri | git pull + rebuild по upstream |
| Мониторинг | UptimeRobot на `/v1/models` или gateway status |

---

## Риски (коротко)

| Риск | Митigation |
|------|------------|
| Colibri медленный → 15s timeout | Fallback на OpenRouter; позже — увеличить local timeout в коде (отдельный PR) |
| ПДн в промпте | Дисклеймер + не вводить ФИО; юрист до prod с пациентами |
| Публичный LLM URL | Длинный API key + rate limit на Caddy / Cloudflare |
| 8 GB RAM | Только малые модели или апгрейд до 16 GB |

---

## Порядок внедрения (согласован с фаундером)

1. **Локально:** закончить `pnpm colibri:setup` на Mac (эталон).  
2. **VPS 16 GB:** шаги 1–4, без Vercel.  
3. **Preview Vercel:** env + тест Evidence/chat.  
4. **Production:** env + redeploy.  
5. Mac можно выключать — трафик идёт VPS.

---

## Альтернатива без своего VPS

Если Colibri на VPS не поднять вовремя:

- **24/7 только cloud:** `COLIBRI_ENABLED=false`, OpenRouter/Perplexity — уже работает.  
- **Позже:** тот же runbook на Selectel/Yandex вместо Hetzner — шаги те же.

См. также: `docs/colibri_aws_deployment_audit.md`, `docs/integrations/colibri.md`.