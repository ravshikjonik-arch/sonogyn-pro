export function formatProtocolField(value: string | number | undefined, suffix = ""): string {
  if (value === undefined || value === "") return "___";
  return `${value}${suffix}`;
}

export function presentProtocolText(
  value: boolean | undefined,
  yes = "визуализируется",
  no = "не визуализируется",
): string {
  if (value === undefined) return "___";
  return value ? yes : no;
}
