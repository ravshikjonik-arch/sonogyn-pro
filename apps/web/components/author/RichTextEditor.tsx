"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { cn } from "@/lib/utils/cn";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value || "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[160px] px-4 py-3 focus:outline-none dark:prose-invert",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-white dark:bg-slate-950", className)}>
      <div className="flex flex-wrap gap-1 border-b border-[var(--clinical-border)] bg-slate-50 p-2 dark:bg-slate-900/50">
        {[
          { label: "B", action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
          { label: "I", action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
          { label: "H2", action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
          { label: "•", action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-bold",
              btn.active ? "bg-[var(--clinical-primary)] text-white" : "bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200",
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
