"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { htmlToPlainText } from "@/lib/clinical-editor/html-to-plain";
import { sanitizeClinicalHtml } from "@/lib/clinical-editor/sanitize-clinical-html";
import { cn } from "@/lib/utils/cn";

export type ClinicalRichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onPlainTextChange?: (plain: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
};

export function ClinicalRichTextEditor({
  value,
  onChange,
  onPlainTextChange,
  placeholder,
  className,
  minHeightClassName = "min-h-[160px]",
}: ClinicalRichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none px-4 py-3 focus:outline-none dark:prose-invert",
          minHeightClassName,
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = sanitizeClinicalHtml(ed.getHTML());
      onChange(html);
      onPlainTextChange?.(htmlToPlainText(html));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const safe = value ? sanitizeClinicalHtml(value) : "<p></p>";
    if (editor.getHTML() !== safe) {
      editor.commands.setContent(safe, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  const toolbar = [
    { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    {
      label: "H2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "•",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
  ] as const;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-white dark:bg-slate-950",
        className,
      )}
    >
      <div className="flex flex-wrap gap-1 border-b border-[var(--clinical-border)] bg-slate-50 p-2 dark:bg-slate-900/50">
        {toolbar.map((btn) => (
          <button
            key={btn.label}
            type="button"
            aria-label={btn.label}
            onClick={btn.action}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-bold",
              btn.active
                ? "bg-[var(--clinical-primary)] text-white"
                : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200",
            )}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      {!value && placeholder ? (
        <p className="pointer-events-none -mt-32 px-4 text-sm text-slate-400">{placeholder}</p>
      ) : null}
    </div>
  );
}
