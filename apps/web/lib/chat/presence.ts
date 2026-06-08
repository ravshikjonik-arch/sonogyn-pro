export type DoctorPresenceRow = {
  user_id: string;
  display_name: string;
  status: "online" | "offline";
  last_seen_at: string;
  updated_at: string;
};

export type DoctorPresenceMember = {
  userId: string;
  displayName: string;
  isOnline: boolean;
  lastSeenAt: string;
};

/** Считаем оффлайн, если heartbeat старше 3 минут. */
export const PRESENCE_STALE_MS = 3 * 60 * 1000;

export function isPresenceOnline(row: Pick<DoctorPresenceRow, "status" | "last_seen_at">, now = Date.now()): boolean {
  if (row.status !== "online") return false;
  const seen = new Date(row.last_seen_at).getTime();
  return Number.isFinite(seen) && now - seen <= PRESENCE_STALE_MS;
}

export function splitPresenceRows(rows: DoctorPresenceRow[]): {
  online: DoctorPresenceMember[];
  offline: DoctorPresenceMember[];
} {
  const now = Date.now();
  const online: DoctorPresenceMember[] = [];
  const offline: DoctorPresenceMember[] = [];

  for (const row of rows) {
    const member: DoctorPresenceMember = {
      userId: row.user_id,
      displayName: row.display_name,
      isOnline: isPresenceOnline(row, now),
      lastSeenAt: row.last_seen_at,
    };
    if (member.isOnline) online.push(member);
    else offline.push(member);
  }

  online.sort((a, b) => a.displayName.localeCompare(b.displayName, "ru"));
  offline.sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime(),
  );

  return { online, offline };
}

export function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "недавно";
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  return new Date(iso).toLocaleDateString("ru-RU");
}
