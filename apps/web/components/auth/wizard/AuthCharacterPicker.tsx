"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";

import type { OnboardingCharacterId } from "@repo/types";

import { CHARACTER_ASSETS } from "@/lib/auth/character-assets";
import { cn } from "@/lib/utils/cn";

const OPTION_IDS: OnboardingCharacterId[] = ["boy", "girl"];

type Props = {
  value: OnboardingCharacterId | null;
  onChange: (id: OnboardingCharacterId) => void;
};

export function AuthCharacterPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-center text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Выберите, кто вы, чтобы получить доступ к персонализированному контенту. Это не медицинские
        данные — только оформление входа.
      </p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Выбор персонажа на экране входа">
        {OPTION_IDS.map((id) => {
          const asset = CHARACTER_ASSETS[id];
          const selected = value === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border-2 text-left transition-[border-color,box-shadow,transform] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
                selected
                  ? "border-cyan-400/90 shadow-[0_0_24px_rgba(34,211,238,0.35)]"
                  : "border-[var(--clinical-border)] hover:border-cyan-500/50",
              )}
            >
              <div className="relative h-36 w-full bg-[#050a14]">
                <Image
                  src={asset.picker}
                  alt=""
                  fill
                  className="object-cover object-top"
                  sizes="240px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-[#0a1628]/20 to-transparent" />
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 bg-[#0c1829]/95 px-3 py-3 backdrop-blur-sm">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-lg text-cyan-300"
                  aria-hidden
                >
                  {asset.symbol}
                </span>
                <span className="flex-1 text-sm font-bold text-white">{asset.labelRu}</span>
                <ArrowRight className="h-4 w-4 text-cyan-400/80 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
