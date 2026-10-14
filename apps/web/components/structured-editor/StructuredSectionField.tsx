"use client";

import type { StructuredCalculatorBlock, StructuredMediaRef, StructuredSectionContent } from "@repo/types";

import { ClinicalRichTextEditor } from "@/components/clinical/ClinicalRichTextEditor";
import { htmlToPlainText } from "@/lib/clinical-editor/html-to-plain";
import {
  CalculatorBlockList,
  CalculatorInsertPanel,
} from "@/components/structured-editor/CalculatorInsertPanel";
import { structuredEditorUuid } from "@/lib/structured-editor/uuid";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  hint: string;
  section: StructuredSectionContent;
  onChange: (next: StructuredSectionContent) => void;
  richText?: boolean;
  showCalculatorInsert?: boolean;
  showMediaInsert?: boolean;
  readOnly?: boolean;
  className?: string;
};

export function StructuredSectionField({
  title,
  hint,
  section,
  onChange,
  richText = true,
  showCalculatorInsert = false,
  showMediaInsert = false,
  readOnly = false,
  className,
}: Props) {
  function insertBlock(block: StructuredCalculatorBlock) {
    onChange({
      ...section,
      blocks: [...(section.blocks ?? []), block],
    });
  }

  function insertMediaPlaceholder() {
    const ref: StructuredMediaRef = {
      id: structuredEditorUuid(),
      label: "Ключевой кадр DICOM (обезличенный)",
      insertedAt: new Date().toISOString(),
    };
    onChange({
      ...section,
      mediaRefs: [...(section.mediaRefs ?? []), ref],
    });
  }

  return (
    <section className={cn("space-y-3 rounded-2xl border border-[var(--clinical-border)] p-4 sm:p-5", className)}>
      <header>
        <h3 className="text-sm font-bold text-[var(--clinical-foreground)]">{title}</h3>
        <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{hint}</p>
      </header>

      {showCalculatorInsert && !readOnly ? <CalculatorInsertPanel onInsert={insertBlock} /> : null}
      <CalculatorBlockList blocks={section.blocks ?? []} />

      {showMediaInsert && !readOnly ? (
        <button
          type="button"
          className="text-xs font-semibold text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
          onClick={insertMediaPlaceholder}
        >
          + Добавить ссылку на ключевой кадр DICOM
        </button>
      ) : null}

      {(section.mediaRefs ?? []).length > 0 ? (
        <ul className="space-y-1 text-xs text-[var(--clinical-foreground-muted)]">
          {(section.mediaRefs ?? []).map((ref) => (
            <li key={ref.id}>🖼 {ref.label ?? "Кадр"} · {new Date(ref.insertedAt).toLocaleString()}</li>
          ))}
        </ul>
      ) : null}

      {richText && !readOnly ? (
        <ClinicalRichTextEditor
          value={section.html ?? ""}
          onChange={(html) =>
            onChange({ ...section, html, plain: htmlToPlainText(html) })
          }
          minHeightClassName="min-h-[100px] sm:min-h-[120px]"
        />
      ) : null}

      {readOnly && section.plain?.trim() ? (
        <p className="whitespace-pre-wrap text-sm text-[var(--clinical-foreground-muted)]">{section.plain}</p>
      ) : null}
    </section>
  );
}
