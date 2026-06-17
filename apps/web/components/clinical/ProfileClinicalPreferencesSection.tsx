"use client";

import { FmfProtocolTemplatePicker } from "@/components/clinical-assistant/FmfProtocolTemplatePicker";
import { useSecondThirdProtocolTemplate } from "@/lib/clinical-assistant/fmf-protocol-template-prefs";
import type { SecondThirdProtocolTemplateId } from "@repo/types";

type Props = {
  initialTemplateId?: SecondThirdProtocolTemplateId;
};

/** Клинические настройки врача на странице профиля. */
export function ProfileClinicalPreferencesSection({ initialTemplateId }: Props) {
  const { templateId, setTemplateId, loading, syncing, syncError, syncedToProfile } =
    useSecondThirdProtocolTemplate({ initialTemplateId });

  return (
    <div className="mt-8 space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Клинические настройки</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Шаблон протокола II/III скрининга применяется в FMF-помощнике на всех устройствах после входа в аккаунт.
        </p>
      </div>
      <FmfProtocolTemplatePicker
        value={templateId}
        onChange={setTemplateId}
        loading={loading}
        syncing={syncing}
        syncError={syncError}
        syncedToProfile={syncedToProfile}
      />
    </div>
  );
}
