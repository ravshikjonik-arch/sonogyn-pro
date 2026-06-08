"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export type CaseCommentRow = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
};

export function CaseDiscussion({ caseId, userId }: { caseId: string; userId: string }) {
  const supabase = useSupabase();
  const [comments, setComments] = useState<CaseCommentRow[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("case_comments")
      .select("id,body,created_at,author_id")
      .eq("case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error(error.message);
      setComments([]);
    } else {
      setComments((data as CaseCommentRow[]) ?? []);
    }
    setLoading(false);
  }, [caseId, supabase]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`case_comments:${caseId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "case_comments",
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          const row = payload.new as CaseCommentRow;
          setComments((prev) => [...prev.filter((c) => c.id !== row.id), row]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [caseId, supabase]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) return;

    const { error } = await supabase.from("case_comments").insert({
      case_id: caseId,
      author_id: userId,
      body: draft.trim(),
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setDraft("");
    toast.success("Comment posted");
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg">Realtime discussion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-slate-500">Start the thread — comments sync instantly via Supabase Realtime.</p>
        ) : (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <p className="text-sm leading-relaxed text-slate-800">{comment.body}</p>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {new Date(comment.created_at).toLocaleString()} · author {comment.author_id.slice(0, 8)}…
                </p>
              </li>
            ))}
          </ul>
        )}

        <Separator />

        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add teaching points…" />
          <Button type="submit" disabled={!draft.trim()}>
            Post comment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
