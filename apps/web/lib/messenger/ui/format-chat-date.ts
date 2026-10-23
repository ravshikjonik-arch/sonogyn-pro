const DAY_MS = 86_400_000;

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Date separator label for message timeline (ru). */
export function formatChatDateLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const today = startOfLocalDay(now);
  const day = startOfLocalDay(d);
  const diffDays = Math.round((today - day) / DAY_MS);

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}
