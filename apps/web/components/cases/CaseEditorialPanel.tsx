"use client";

import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRareSlot } from "@/lib/cases/feed-curation";

type Props = {
  caseId: string;
  isRare: boolean;
  rareSlot: string | null;
  editorialPriority: number;
};

const RARE_SLOTS = [
  { value: "", label: "— не выбрано —" },
  { value: "week", label: formatRareSlot("week") ?? "Неделя" },
  { value: "month", label: formatRareSlot("month") ?? "Месяц" },
  { value: "dont_miss", label: formatRareSlot("dont_miss") ?? "Не пропустить" },
] as const;

/** Moderator editorial flags for `/feed` (Rare / Case of day). */
export function CaseEditorialPanel({ caseId, isRare, rareSlot, editorialPriority }: Props) {
  const router = useRouter();
  const [rare, setRare] = useState(isRare);
  const [slot, setSlot] = useState(rareSlot ?? "");
  const [priority, setPriority] = useState(String(editorialPriority));
  const [busy, setBusy] = useState(false);

  async function save() {
    const parsedPriority = Number.parseInt(priority, 10);
    if (Number.isNaN(parsedPriority) || parsedPriority < 0 || parsedPriority > 100) {
      toast.error("Приоритет: число 0–100");
      return;
    }

    setBusy(true);
    const response = await fetch(`/api/cases/${caseId}/editorial`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_rare: rare,
        rare_slot: slot || null,
        editorial_priority: parsedPriority,
      }),
    });
    setBusy(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toast.error(payload?.error ?? "Не удалось сохранить editorial-разметку");
      return;
    }
    toast.success("Editorial-разметка сохранена");
    router.refresh();
  }

  return (
    <Card className="border-amber-200/80 bg-amber-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-amber-700" />
          Editorial (модератор)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={rare} onChange={(e) => setRare(e.target.checked)} />
          Редкий случай (`is_rare`) — блок на /feed
        </label>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">
            Rare slot
          </label>
          <select
            className="w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
          >
            {RARE_SLOTS.map((opt) => (
              <option key={opt.value || "none"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">
            Editorial priority (Case of day)
          </label>
          <Input
            type="number"
            min={0}
            max={100}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>
        <Button type="button" size="sm" disabled={busy} onClick={() => void save()}>
          {busy ? "Сохранение…" : "Сохранить editorial"}
        </Button>
      </CardContent>
    </Card>
  );
}
