"use client";

import { Share, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { PWA_INSTALL_HINT_RU } from "@/lib/config/platform";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PwaInstallDialog({ open, onOpenChange }: Props) {
  const { canNativeInstall, showIosInstructions, promptInstall, installed } = usePwaInstall();

  async function onInstallClick() {
    const outcome = await promptInstall();
    if (outcome === "accepted") onOpenChange(false);
  }

  if (installed) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-[var(--clinical-primary)]" aria-hidden />
            SonoGyn Pro на рабочем столе
          </DialogTitle>
          <DialogDescription className="text-left text-sm leading-relaxed">
            {PWA_INSTALL_HINT_RU}
          </DialogDescription>
        </DialogHeader>

        {showIosInstructions ? (
          <ol className="list-decimal space-y-2 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
            <li>
              Нажмите <Share className="mx-0.5 inline h-4 w-4 align-text-bottom" aria-hidden />{" "}
              <strong className="font-semibold text-[var(--clinical-foreground)]">«Поделиться»</strong> в Safari
              (нижняя панель).
            </li>
            <li>
              Выберите{" "}
              <strong className="font-semibold text-[var(--clinical-foreground)]">«На экран «Домой»</strong>.
            </li>
            <li>Подтвердите — иконка появится на домашнем экране iPhone/iPad.</li>
          </ol>
        ) : canNativeInstall ? (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Браузер предложит установить приложение без магазина — калькуляторы и кабинет откроются в отдельном
            окне.
          </p>
        ) : (
          <p className="text-sm text-[var(--clinical-foreground-muted)]">
            Откройте сайт в Chrome или Edge на Android / компьютере — появится пункт установки. На iOS используйте
            Safari и «На экран «Домой»».
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Позже
          </Button>
          {canNativeInstall ? (
            <Button type="button" onClick={() => void onInstallClick()}>
              Установить
            </Button>
          ) : (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Понятно
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
