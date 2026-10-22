export const MISSING_VALUE_RU = "[не указано]";

export function formatField(label: string, value: string | number | null | undefined, missingKeys: string[]): string {
  if (value === null || value === undefined || value === "") {
    missingKeys.push(label);
    return `${label}: ${MISSING_VALUE_RU}`;
  }
  return `${label}: ${value}`;
}

export function joinSections(sections: { title?: string; lines: string[] }[]): string {
  return sections
    .map((s) => {
      const head = s.title ? `${s.title}\n` : "";
      return head + s.lines.join("\n");
    })
    .join("\n\n");
}
