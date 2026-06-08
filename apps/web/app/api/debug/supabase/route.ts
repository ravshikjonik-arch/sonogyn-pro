import { NextResponse } from "next/server";

/**
 * Только для локальной отладки: видно, достучался ли Next-сервер до Supabase на машине разработчика.
 * Откройте в браузере: GET /api/debug/supabase
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, step: "env", detail: "NEXT_PUBLIC_SUPABASE_URL или ANON_KEY пустые на сервере Next (перезапустите dev после правки .env.local)." },
      { status: 500 },
    );
  }

  try {
    const healthUrl = `${url.replace(/\/$/, "")}/auth/v1/health`;
    const r = await fetch(healthUrl, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    });
    const text = await r.text();
    return NextResponse.json({
      ok: r.ok,
      httpStatus: r.status,
      healthUrl,
      bodyPreview: text.slice(0, 280),
      hint:
        r.ok
          ? "Сервер Next видит Supabase. Если в браузере всё ещё «failed to fetch» — чаще всего блокировка/DNS на стороне браузера или расширения."
          : "Supabase ответил с ошибкой — проверьте ключ (попробуйте legacy anon JWT eyJ… на странице API) и что проект не на паузе.",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        step: "fetch",
        detail: msg,
        hint:
          "Сервер Next не смог открыть Supabase (DNS, файрвол, VPN, регион). Проверьте в терминале: ping или откройте Project URL в браузере. Попробуйте другую сеть или DNS 1.1.1.1.",
      },
      { status: 500 },
    );
  }
}
