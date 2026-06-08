"use client";

import Image from "next/image";
import { useCallback, useMemo, useRef, useState } from "react";

import {
  buildUterusCoronalProtocolBlock,
  centroidOfStroke,
  formatUterusCoronalMarkerRu,
  strokeToSvgPath,
  UTERUS_CORONAL_ANATOMY_SRC,
  type UterusCoronalMarker,
  type UterusLesionKind,
  type UterusNormPoint,
} from "@repo/clinical-3d";

import { plainTextToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

type Tool = "place" | "draw";

const KINDS: { id: UterusLesionKind; label: string }[] = [
  { id: "myoma", label: "Миома" },
  { id: "adenomyosis", label: "Аденомиоз" },
  { id: "polyp", label: "Полип" },
  { id: "endometrioma", label: "Эндометриома" },
  { id: "other", label: "Другое" },
];

function normFromEvent(clientX: number, clientY: number, rect: DOMRect): UterusNormPoint {
  return {
    x: Math.max(0.02, Math.min(0.98, (clientX - rect.left) / rect.width)),
    y: Math.max(0.02, Math.min(0.98, (clientY - rect.top) / rect.height)),
  };
}

export function UterusCoronalAtlas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("place");
  const [kind, setKind] = useState<UterusLesionKind>("myoma");
  const [diameterMm, setDiameterMm] = useState(32);
  const [pedunculated, setPedunculated] = useState(false);
  const [markers, setMarkers] = useState<UterusCoronalMarker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStroke, setDraftStroke] = useState<UterusNormPoint[]>([]);
  const drawing = useRef(false);

  const selected = markers.find((m) => m.id === selectedId) ?? markers[markers.length - 1];
  const protocolText = useMemo(() => buildUterusCoronalProtocolBlock(markers), [markers]);
  const exportSpec = useMemo(
    () =>
      plainTextToDocumentSpec({
        filenameBase: "uterus-coronal-protocol",
        title: "Локализация · макет матки",
        text: protocolText,
      }),
    [protocolText],
  );

  const addMarker = useCallback(
    (point: UterusNormPoint, stroke?: UterusNormPoint[]) => {
      const id = `ut-${Date.now()}`;
      setMarkers((prev) => [
        ...prev,
        {
          id,
          point,
          kind,
          diameterMm,
          pedunculated: kind === "myoma" ? pedunculated : false,
          stroke,
        },
      ]);
      setSelectedId(id);
    },
    [kind, diameterMm, pedunculated],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = hostRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pt = normFromEvent(e.clientX, e.clientY, rect);

      if (tool === "draw") {
        drawing.current = true;
        setDraftStroke([pt]);
        el.setPointerCapture(e.pointerId);
        return;
      }

      const hit = markers.find((m) => {
        const dx = (m.point.x - pt.x) * rect.width;
        const dy = (m.point.y - pt.y) * rect.height;
        return Math.hypot(dx, dy) < 24;
      });
      if (hit) {
        setSelectedId(hit.id);
        return;
      }
      addMarker(pt);
    },
    [tool, markers, addMarker],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drawing.current || tool !== "draw" || !hostRef.current) return;
      const rect = hostRef.current.getBoundingClientRect();
      const pt = normFromEvent(e.clientX, e.clientY, rect);
      setDraftStroke((prev) => [...prev, pt]);
    },
    [tool],
  );

  const onPointerUp = useCallback(() => {
    if (!drawing.current || tool !== "draw") return;
    drawing.current = false;
    if (draftStroke.length >= 3) addMarker(centroidOfStroke(draftStroke), draftStroke);
    else if (draftStroke.length === 1) addMarker(draftStroke[0]);
    setDraftStroke([]);
  }, [tool, draftStroke, addMarker]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={tool === "place" ? "default" : "outline"} onClick={() => setTool("place")}>
          Курсор · очаг
        </Button>
        <Button size="sm" variant={tool === "draw" ? "default" : "outline"} onClick={() => setTool("draw")}>
          Обвести контур
        </Button>
        <Button size="sm" variant="outline" onClick={() => setMarkers([])}>
          Очистить
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Button
            key={k.id}
            size="sm"
            variant={kind === k.id ? "default" : "outline"}
            onClick={() => setKind(k.id)}
          >
            {k.label}
          </Button>
        ))}
      </div>

      {kind === "myoma" ? (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-[var(--clinical-foreground-muted)]">Диаметр, мм</span>
            <Input
              type="number"
              className="w-20"
              value={diameterMm}
              onChange={(e) => setDiameterMm(Number(e.target.value) || 0)}
            />
          </label>
          <Button
            size="sm"
            variant={pedunculated ? "default" : "outline"}
            onClick={() => setPedunculated((v) => !v)}
          >
            На ножке
          </Button>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
        Коронарный макет (как на атласе FIGO): клик по матке, шейке или придаткам — текст для протокола с FIGO для
        миомы. Слева на рисунке — правая придатка пациентки, справа — левая (как при лицевом разрезе).
      </p>

      <div
        ref={hostRef}
        className={cn(
          "relative mx-auto max-w-3xl overflow-hidden rounded-2xl border-2 border-rose-200 bg-black/5 shadow-xl",
          tool === "place" || tool === "draw" ? "cursor-crosshair" : "",
        )}
        style={{ aspectRatio: "4/3" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <Image
          src={UTERUS_CORONAL_ANATOMY_SRC}
          alt="Коронарный разрез матки, маточные трубы и яичники"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1000 750" preserveAspectRatio="xMidYMid meet">
          {markers.map((m) => {
            const active = m.id === selectedId;
            const cx = m.point.x * 1000;
            const cy = m.point.y * 750;
            return (
              <g key={m.id}>
                {m.stroke && m.stroke.length > 1 ? (
                  <path
                    d={strokeToSvgPath(m.stroke, 1000, 750)}
                    fill="none"
                    stroke={active ? "#7c2d12" : "#ea580c"}
                    strokeWidth={active ? 3 : 2}
                  />
                ) : null}
                <circle
                  cx={cx}
                  cy={cy}
                  r={active ? 14 : 10}
                  fill="#f97316"
                  stroke="#7c2d12"
                  strokeWidth={active ? 3 : 2}
                  opacity={0.95}
                />
              </g>
            );
          })}
          {draftStroke.length > 1 ? (
            <path
              d={strokeToSvgPath(draftStroke, 1000, 750)}
              fill="none"
              stroke="#ea580c"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          ) : null}
        </svg>
      </div>

      {selected ? (
        <div className="sonogyn-glass-card rounded-2xl p-4">
          <p className="text-sm font-bold text-rose-950">Выбранный очаг</p>
          <p className="mt-2 text-sm leading-relaxed">{formatUterusCoronalMarkerRu(selected)}</p>
        </div>
      ) : null}

      <div className="sonogyn-glass-card space-y-3 rounded-2xl p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <p className="text-sm font-bold">Текст для протокола</p>
          <Button size="sm" variant="secondary" onClick={() => void navigator.clipboard.writeText(protocolText)}>
            Копировать
          </Button>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-slate-900/5 p-4 text-sm leading-relaxed dark:bg-white/5">
          {protocolText}
        </pre>
        <DocumentExportToolbar spec={exportSpec} compact />
      </div>
    </div>
  );
}
