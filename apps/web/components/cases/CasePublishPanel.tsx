"use client";

import { Globe, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { useSupabase } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { canPublishCaseMedia, formatPublishBlockedError } from "@/lib/cases/anonymization-gate";

type Props = {
  caseId: string;
  userId: string;
  ownerId: string;
  status: string;
  isPublic: boolean;
};

export function CasePublishPanel({ caseId, userId, ownerId, status, isPublic }: Props) {
  const supabase = useSupabase();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isOwner = userId === ownerId;
  const published = status === "published" && isPublic;

  if (!isOwner) {
    return published ? (
      <Badge variant="outline" className="gap-1">
        <Globe className="h-3 w-3" />
        Публичный кейс
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <Lock className="h-3 w-3" />
        Черновик автора
      </Badge>
    );
  }

  async function publish() {
    setBusy(true);
    const { data: mediaRows, error: mediaError } = await supabase
      .from("case_media")
      .select("anonymization_status")
      .eq("case_id", caseId);

    if (mediaError) {
      setBusy(false);
      toast.error("Не удалось проверить медиа перед публикацией");
      return;
    }

    const gate = canPublishCaseMedia(mediaRows ?? []);
    if (!gate.ok) {
      setBusy(false);
      toast.error(gate.reason ?? "Подтвердите анонимизацию всех файлов");
      return;
    }

    const { error } = await supabase
      .from("cases")
      .update({ status: "published", is_public: true })
      .eq("id", caseId)
      .eq("user_id", userId);
    setBusy(false);
    if (error) {
      toast.error(formatPublishBlockedError(error.message));
      return;
    }
    toast.success("Кейс опубликован — коллеги увидят в ленте чата");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {published ? (
        <Badge className="gap-1 bg-emerald-600">
          <Globe className="h-3 w-3" />
          В ленте чата
        </Badge>
      ) : (
        <>
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Черновик
          </Badge>
          <Button type="button" size="sm" disabled={busy} onClick={() => void publish()}>
            {busy ? "Публикация…" : "Опубликовать для коллег"}
          </Button>
          <p className="w-full text-xs text-[var(--clinical-foreground-muted)]">
            Если есть снимки — подтвердите анонимизацию каждого файла в галерее (R6).
          </p>
        </>
      )}
    </div>
  );
}
