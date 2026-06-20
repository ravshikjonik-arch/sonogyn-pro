/** Минимальный рендер markdown для quickref (заголовки, списки, таблицы, blockquote). */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

export function renderSimpleMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      html.push(`<h1>${inlineMarkdown(trimmed.slice(2))}</h1>`);
      i += 1;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      html.push(`<h2>${inlineMarkdown(trimmed.slice(3))}</h2>`);
      i += 1;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      html.push(`<h3>${inlineMarkdown(trimmed.slice(4))}</h3>`);
      i += 1;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i]?.trim().startsWith(">") ?? false)) {
        quoteLines.push((lines[i] ?? "").trim().replace(/^>\s?/, ""));
        i += 1;
      }
      html.push(`<blockquote>${quoteLines.map((q) => inlineMarkdown(q)).join("<br/>")}</blockquote>`);
      continue;
    }

    if (isTableRow(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i] ?? "")) {
        tableLines.push(lines[i] ?? "");
        i += 1;
      }
      const rows = tableLines.filter((row) => !isTableSeparator(row)).map(parseTableRow);
      if (rows.length) {
        const [head, ...body] = rows;
        html.push("<table><thead><tr>");
        for (const cell of head) html.push(`<th>${inlineMarkdown(cell)}</th>`);
        html.push("</tr></thead><tbody>");
        for (const row of body) {
          html.push("<tr>");
          for (const cell of row) html.push(`<td>${inlineMarkdown(cell)}</td>`);
          html.push("</tr>");
        }
        html.push("</tbody></table>");
      }
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      html.push("<ul>");
      while (i < lines.length) {
        const item = lines[i]?.trim() ?? "";
        if (!item.startsWith("- ") && !item.startsWith("* ")) break;
        html.push(`<li>${inlineMarkdown(item.slice(2))}</li>`);
        i += 1;
      }
      html.push("</ul>");
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      html.push("<ol>");
      while (i < lines.length) {
        const item = lines[i]?.trim() ?? "";
        if (!/^\d+\.\s/.test(item)) break;
        html.push(`<li>${inlineMarkdown(item.replace(/^\d+\.\s/, ""))}</li>`);
        i += 1;
      }
      html.push("</ol>");
      continue;
    }

    const paraLines: string[] = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i]?.trim() ?? "";
      if (!next || next.startsWith("#") || next.startsWith(">") || next.startsWith("- ") || next.startsWith("* ") || isTableRow(next)) break;
      paraLines.push(next);
      i += 1;
    }
    html.push(`<p>${inlineMarkdown(paraLines.join(" "))}</p>`);
  }

  return html.join("\n");
}

export function studentGuideParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}
