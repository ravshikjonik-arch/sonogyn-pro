"use client";

import { Loader2, Square, Volume2, VolumeX } from "lucide-react";
import { useMemo, useState } from "react";

import { useOptionalVoiceReader } from "@/components/voice/VoiceReaderProvider";
import { useSpeechSynthesis, type VoiceGender } from "@/hooks/useSpeechSynthesis";
import { APP_LOCALES, type AppLocale } from "@/lib/i18n/locale";
import { DEMO_VOICE_TOPICS } from "@/lib/voice/demo-topics";
import type { VoiceTopic } from "@/lib/voice/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

export type TopicListProps = {
  topics?: VoiceTopic[];
  /** Показать блок произвольного текста */
  showFreeText?: boolean;
  className?: string;
};

function VoiceControls({
  locale,
  onLocaleChange,
  rate,
  onRateChange,
  gender,
  onGenderChange,
  selectedVoiceName,
  speechLang,
  isSpeaking,
  activeLabel,
  onStop,
  supported,
}: {
  locale: AppLocale;
  onLocaleChange: (l: AppLocale) => void;
  rate: number;
  onRateChange: (r: number) => void;
  gender: VoiceGender;
  onGenderChange: (g: VoiceGender) => void;
  selectedVoiceName: string | null;
  speechLang: string;
  isSpeaking: boolean;
  activeLabel: string | null;
  onStop: () => void;
  supported: boolean;
}) {
  return (
    <Card className="border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Настройки озвучивания</CardTitle>
        <CardDescription>Web Speech API · нейтральный тон · {speechLang}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!supported ? (
          <p className="rounded-xl border border-amber-400/50 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Браузер не поддерживает синтез речи (TTS). Используйте Chrome или Edge на компьютере.
          </p>
        ) : null}

        {isSpeaking ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--clinical-primary)]/40 bg-[var(--clinical-primary-muted)]/30 px-3 py-2">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--clinical-primary)]" />
            <span className="text-sm font-medium">Идёт озвучивание: {activeLabel}</span>
            <Button type="button" variant="destructive" size="sm" onClick={onStop}>
              <Square className="h-3 w-3" />
              Стоп
            </Button>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--clinical-foreground-muted)]">Язык</span>
            <select
              className="h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-3 text-sm dark:bg-[var(--clinical-muted)]"
              value={locale}
              onChange={(e) => onLocaleChange(e.target.value as AppLocale)}
              disabled={isSpeaking}
            >
              {APP_LOCALES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium text-[var(--clinical-foreground-muted)]">Голос</span>
            <select
              className="h-10 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-3 text-sm dark:bg-[var(--clinical-muted)]"
              value={gender}
              onChange={(e) => onGenderChange(e.target.value as VoiceGender)}
              disabled={isSpeaking}
            >
              <option value="female">Женский (ru / системный)</option>
              <option value="male">Мужской (ru / системный)</option>
            </select>
            {selectedVoiceName ? (
              <span className="block text-[11px] text-[var(--clinical-foreground-muted)]">
                Выбран: {selectedVoiceName}
              </span>
            ) : (
              <span className="block text-[11px] text-[var(--clinical-foreground-muted)]">
                Голос подберётся автоматически после загрузки списка системы
              </span>
            )}
          </label>
        </div>

        <label className="block space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[var(--clinical-foreground-muted)]">Скорость речи</span>
            <Badge variant="outline">{rate.toFixed(1)}×</Badge>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.2}
            step={0.1}
            value={rate}
            disabled={isSpeaking}
            onChange={(e) => onRateChange(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-[var(--clinical-primary)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--clinical-foreground-muted)]">
            <span>0.8× медленнее</span>
            <span>1.2× быстрее</span>
          </div>
        </label>
      </CardContent>
    </Card>
  );
}

/** Карточки тем с кнопкой «Озвучить». */
export function TopicList({ topics = DEMO_VOICE_TOPICS, showFreeText = true, className }: TopicListProps) {
  const globalVoice = useOptionalVoiceReader();
  const localTts = useSpeechSynthesis();
  const tts = globalVoice ?? localTts;
  const useGlobalDock = Boolean(globalVoice);

  const [freeText, setFreeText] = useState("");

  const selectedVoiceName = tts.selectedVoice?.name ?? null;

  const topicCards = useMemo(() => topics, [topics]);

  function speakTopic(topic: VoiceTopic) {
    const payload = `${topic.title}. ${topic.text}`;
    if (globalVoice) {
      globalVoice.speakText(payload, topic.title);
      return;
    }
    tts.speak(payload, { topicId: topic.id, label: topic.title });
  }

  function speakFreeText() {
    if (globalVoice) {
      globalVoice.speakText(freeText, "Свой текст");
      return;
    }
    tts.speak(freeText, { topicId: "__free__", label: "Свой текст" });
  }

  function isTopicActive(topic: VoiceTopic) {
    if (globalVoice) {
      return globalVoice.isSpeaking && globalVoice.activeLabel === topic.title;
    }
    return tts.activeTopicId === topic.id && tts.isSpeaking;
  }

  return (
    <div className={cn("mx-auto max-w-3xl space-y-6 px-4 py-8 lg:px-8", className)}>
      <header className="space-y-2">
        <Badge variant="outline" className="gap-1">
          <Volume2 className="h-3 w-3" />
          Text-to-Speech
        </Badge>
        <h1 className="text-2xl font-black tracking-tight text-[var(--clinical-foreground)]">
          Озвучивание тем
        </h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Синтез речи из текста для быстрого прослушивания протоколов и учебных материалов.
          {useGlobalDock ? " Настройки — в панели 🔊 справа внизу на любой вкладке." : null}
        </p>
      </header>

      {!useGlobalDock ? (
        <VoiceControls
          locale={tts.locale}
          onLocaleChange={tts.setLocale}
          rate={tts.rate}
          onRateChange={tts.setRate}
          gender={tts.gender}
          onGenderChange={tts.setGender}
          selectedVoiceName={selectedVoiceName}
          speechLang={tts.speechLang}
          isSpeaking={tts.isSpeaking}
          activeLabel={tts.activeLabel}
          onStop={tts.stop}
          supported={tts.supported}
        />
      ) : null}

      {tts.error ? (
        <p className="rounded-xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {tts.error}
        </p>
      ) : null}

      <div className="space-y-4">
        {topicCards.map((topic) => {
          const isActive = isTopicActive(topic);
          return (
            <Card
              key={topic.id}
              className={cn(
                "border-[var(--clinical-border)] transition-colors",
                isActive && "border-[var(--clinical-primary)] ring-1 ring-[var(--clinical-primary)]/30",
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {topic.text}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={!tts.supported}
                    onClick={() => speakTopic(topic)}
                    className="gap-2"
                  >
                    {isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                    Озвучить
                  </Button>
                  {isActive ? (
                    <Button type="button" variant="outline" onClick={tts.stop}>
                      <VolumeX className="h-4 w-4" />
                      Остановить
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showFreeText ? (
        <Card className="border-dashed border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-base">Свой текст</CardTitle>
            <CardDescription>Вставьте фрагмент протокола или заключения — прочитаем целиком</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              rows={6}
              placeholder="Введите или вставьте текст для озвучивания…"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              disabled={tts.isSpeaking && tts.activeLabel !== "Свой текст"}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!tts.supported || !freeText.trim()} onClick={speakFreeText}>
                <Volume2 className="h-4 w-4" />
                Читать
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!tts.isSpeaking}
                onClick={tts.stop}
              >
                <Square className="h-4 w-4" />
                Стоп
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

/** Полный блок: настройки + темы + произвольный текст (alias TopicList). */
export function VoiceReader(props: TopicListProps) {
  return <TopicList {...props} />;
}

export { useSpeechSynthesis };
