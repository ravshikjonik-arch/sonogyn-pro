"""PRO gate для Streamlit и worker (license key / Supabase JWT)."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import httpx


def _valid_pro_keys() -> set[str]:
    raw = os.environ.get("SONOGYN_PRO_KEYS", "") or os.environ.get("SONOGYN_PRO_LICENSE_KEYS", "")
    return {k.strip() for k in raw.split(",") if k.strip()}


def verify_pro_license_key(key: str) -> bool:
    keys = _valid_pro_keys()
    if not keys:
        return False
    return key.strip() in keys


def verify_supabase_pro_jwt(jwt: str) -> tuple[bool, str]:
    """
    Проверка subscription_tier / trial через Supabase REST.
    Требует SUPABASE_URL + anon key (или service role для admin).
    """
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    anon = os.environ.get("SUPABASE_ANON_KEY", "").strip() or os.environ.get(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY", ""
    ).strip()
    if not url or not anon or not jwt.strip():
        return False, "Supabase не настроен"

    try:
        with httpx.Client(timeout=15.0) as client:
            user_res = client.get(
                f"{url}/auth/v1/user",
                headers={"Authorization": f"Bearer {jwt}", "apikey": anon},
            )
            if user_res.status_code != 200:
                return False, "Недействительный JWT"
            user = user_res.json()
            user_id = user.get("id")
            if not user_id:
                return False, "Нет user id"

            prof_res = client.get(
                f"{url}/rest/v1/profiles",
                params={"id": f"eq.{user_id}", "select": "subscription_tier,trial_ends_at"},
                headers={"Authorization": f"Bearer {jwt}", "apikey": anon},
            )
            if prof_res.status_code != 200:
                return False, "Профиль недоступен"
            rows = prof_res.json()
            if not rows:
                return False, "Профиль не найден"
            row = rows[0]
            tier = str(row.get("subscription_tier") or "").lower()
            if tier == "pro":
                return True, "PRO subscription"
            trial = row.get("trial_ends_at")
            if trial:
                end = datetime.fromisoformat(str(trial).replace("Z", "+00:00"))
                if end > datetime.now(timezone.utc):
                    return True, "PRO trial"
            return False, "Нужна подписка PRO"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def is_pro_access(*, license_key: str | None = None, jwt: str | None = None) -> tuple[bool, str]:
    """Dev bypass: SONOGYN_PRO_DEV_BYPASS=1"""
    if os.environ.get("SONOGYN_PRO_DEV_BYPASS", "").strip() in ("1", "true", "yes"):
        return True, "dev bypass"

    if license_key and verify_pro_license_key(license_key):
        return True, "license key"

    if jwt:
        ok, msg = verify_supabase_pro_jwt(jwt)
        if ok:
            return True, msg

    if _valid_pro_keys():
        return False, "Введите PRO license key"
    return False, "PRO не настроен (SONOGYN_PRO_KEYS или Supabase JWT)"
