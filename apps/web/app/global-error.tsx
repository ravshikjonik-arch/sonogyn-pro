"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "system-ui,sans-serif", background: "#f1f5f9", color: "#0f172a" }}>
        <div style={{ padding: "2rem", maxWidth: "36rem", margin: "0 auto" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Критическая ошибка</h1>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem", color: "#475569" }}>
            Откройте Console в браузере (F12). Нажмите кнопку ниже после исправления кода.
          </p>
          <pre
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              background: "#fff",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              overflow: "auto",
              color: "#991b1b",
            }}
          >
            {error.message}
          </pre>
          <button
            type="button"
            style={{
              marginTop: "1.5rem",
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.75rem",
              border: "none",
              background: "#1d6fd8",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => reset()}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
