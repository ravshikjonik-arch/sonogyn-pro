import type { StudentRow } from "@/lib/courses/types";

export function studentsToCsv(rows: StudentRow[]): string {
  const header = ["user_id", "full_name", "email", "phone", "progress_percent", "enrolled_at", "last_activity_at"];
  const lines = [header.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.userId,
        csvEscape(row.fullName ?? ""),
        csvEscape(row.email ?? ""),
        csvEscape(row.phone ?? ""),
        String(row.progressPercent),
        row.enrolledAt,
        row.lastActivityAt,
      ].join(","),
    );
  }
  return lines.join("\n");
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
