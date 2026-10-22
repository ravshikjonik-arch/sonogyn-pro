/** JS \\b is ASCII-only; use for RU/EN mixed clinical dictation. */
export function ruToken(pattern: string, flags = "gi"): RegExp {
  const body = pattern.includes("|") ? `(?:${pattern})` : pattern;
  return new RegExp(
    String.raw`(?<![\p{L}\p{N}])${body}(?![\p{L}\p{N}])`,
    flags.includes("u") ? flags : `${flags}u`,
  );
}
