#!/usr/bin/env node
/**
 * Проверка, что HTML на custom domain не обрезан (иначе белый экран / вечная загрузка).
 * Usage: node scripts/check-custom-domain-html.mjs [https://sonogyn-pro.ru]
 */
const base = (process.argv[2] ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const paths = ["/home", "/"];

async function fetchBody(path) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SonogynCustomDomainCheck/1.0; +https://sonogyn-pro.ru)",
      Accept: "text/html",
    },
  });
  const text = await res.text();
  return { url: res.url, status: res.status, bytes: text.length, text };
}

console.log(`\n📄 Custom domain HTML · ${base}\n`);

let failed = false;
for (const path of paths) {
  try {
    const { url, status, bytes, text } = await fetchBody(path);
    const complete = text.includes("</html>");
    if (status >= 200 && status < 400 && complete) {
      if (bytes >= 16_384) {
        console.log(`⚠️  ${path} → ${status}, ${bytes} B, полный HTML — >16KB (на CF proxy может обрезаться)`);
      } else {
        console.log(`✅ ${path} → ${status}, ${bytes} B, полный HTML (final ${url})`);
      }
    } else {
      failed = true;
      console.log(
        `❌ ${path} → ${status}, ${bytes} B, </html>: ${complete} (final ${url}) — обрезка или таймаут`,
      );
    }
  } catch (e) {
    failed = true;
    console.log(`❌ ${path} → ${e instanceof Error ? e.message : e}`);
  }
}

if (failed) {
  console.log("\n→ Cloudflare: DNS only (серое облако) на A/CNAME Vercel.");
  console.log("→ node scripts/check-production-dns.mjs\n");
  process.exit(1);
}

console.log("\nOK\n");
