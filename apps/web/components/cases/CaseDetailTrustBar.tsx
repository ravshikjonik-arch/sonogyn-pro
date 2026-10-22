"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { TeachingCaseVotePanel } from "@/components/cases/TeachingCaseVotePanel";
import { DoctorVerificationMark } from "@/components/trust/DoctorVerificationMark";
import { ReputationLevelBadge } from "@/components/trust/ReputationLevelBadge";
import { useSupabase } from "@/app/providers";
import { resolveAuthorNames } from "@/lib/chat/resolve-author-names";
import { resolveAuthorTrust } from "@/lib/trust/resolve-author-trust";

type Props = {
  caseId: string;
  authorId: string;
  voteUpCount: number;
  rating: number;
  userId: string | null;
};

export function CaseDetailTrustBar({ caseId, authorId, voteUpCount, rating, userId }: Props) {
  const supabase = useSupabase();
  const [authorName, setAuthorName] = useState("Автор кейса");
  const [verified, setVerified] = useState(false);
  const [reputation, setReputation] = useState(0);
  const [selfVerified, setSelfVerified] = useState(false);
  const [userVote, setUserVote] = useState<1 | -1 | undefined>();
  const [counts, setCounts] = useState({ up: voteUpCount, rating });

  const refreshSocial = useCallback(async () => {
    if (!userId) return;
    const res = await fetch(`/api/cases/social?ids=${encodeURIComponent(caseId)}`);
    if (!res.ok) return;
    const body = (await res.json()) as { userVotes?: Record<string, 1 | -1> };
    setUserVote(body.userVotes?.[caseId]);
  }, [caseId, userId]);

  useEffect(() => {
    void (async () => {
      const [names, trust] = await Promise.all([
        resolveAuthorNames(supabase, [authorId]),
        resolveAuthorTrust(supabase, [authorId]),
      ]);
      setAuthorName(names[authorId] ?? "Автор кейса");
      setVerified(trust[authorId]?.isVerified ?? false);
      setReputation(trust[authorId]?.reputation ?? 0);
    })();
  }, [supabase, authorId]);

  useEffect(() => {
    if (!userId) return;
    void supabase
      .from("profiles")
      .select("is_verified")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => setSelfVerified(Boolean(data?.is_verified)));
    void refreshSocial();
  }, [supabase, userId, refreshSocial]);

  async function onVote(id: string, vote: 1 | -1 | 0) {
    if (!userId) {
      toast.message("Нужна авторизация");
      return;
    }
    if (!selfVerified) {
      toast.message("Голосовать могут подтверждённые врачи", { description: "Страница /verify" });
      return;
    }
    const res = await fetch(`/api/cases/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      toast.error(body?.error ?? "Не удалось сохранить голос");
      return;
    }
    await refreshSocial();
    setCounts((c) => ({
      up: vote === 1 ? c.up + 1 : vote === 0 && userVote === 1 ? Math.max(0, c.up - 1) : c.up,
      rating: c.rating + (vote === 1 ? 1 : vote === -1 ? -1 : userVote === 1 ? -1 : userVote === -1 ? 1 : 0),
    }));
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--clinical-border)] pt-4">
      <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--clinical-foreground-muted)]">
        <DoctorVerificationMark isVerified={verified} size="md" />
        <span>{authorName}</span>
        {reputation > 0 ? <ReputationLevelBadge reputation={reputation} compact /> : null}
      </p>
      <TeachingCaseVotePanel
        caseId={caseId}
        voteUpCount={counts.up}
        rating={counts.rating}
        userVote={userVote ?? null}
        disabled={!userId}
        onVote={(id, v) => void onVote(id, v)}
      />
    </div>
  );
}
