import { UTERUS_SAGITTAL_SLICE_SRC } from "@clinical/uterus";

import type { ScarWorkspaceState } from "@/lib/scar/scar-workspace";

export type ScarSnapshotPoint = { x: number; y: number };

type SnapshotInput = {
  state: ScarWorkspaceState;
  scarPoint: ScarSnapshotPoint;
  sacPoint: ScarSnapshotPoint;
  scarStroke: ScarSnapshotPoint[];
};

const W = 1000;
const H = 625;
const INTERNAL_OS = { x: 512, y: 508 };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Cannot load sagittal uterus image"));
    img.src = src;
  });
}

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight);
  const width = img.naturalWidth * scale;
  const height = img.naturalHeight * scale;
  ctx.drawImage(img, (W - width) / 2, (H - height) / 2, width, height);
}

function toPx(point: ScarSnapshotPoint) {
  return { x: point.x * W, y: point.y * H };
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = "#111827") {
  ctx.save();
  ctx.font = "700 18px system-ui, -apple-system, Segoe UI, sans-serif";
  const metrics = ctx.measureText(text);
  const width = metrics.width + 22;
  const height = 30;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, 12);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 1);
  ctx.restore();
}

function drawStroke(ctx: CanvasRenderingContext2D, points: ScarSnapshotPoint[]) {
  if (points.length < 2) return;
  ctx.save();
  ctx.beginPath();
  points.forEach((point, index) => {
    const p = toPx(point);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalAlpha = 0.78;
  ctx.stroke();
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, state: ScarWorkspaceState) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fillRect(0, H - 62, W, 62);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 18px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(
    state.scenario === "early_pregnancy"
      ? "Рубец после КС · оценка ранней беременности / CSP"
      : "Рубец после КС · ниша / истмоцеле",
    24,
    H - 36,
  );
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Учебная схема; финальную интерпретацию выполняет специалист по ТВУЗИ/ЦДК.", 24, H - 14);
  ctx.restore();
}

export async function generateScarNicheSnapshotDataUrl(input: SnapshotInput): Promise<string | undefined> {
  if (typeof document === "undefined") return undefined;

  const image = await loadImage(UTERUS_SAGITTAL_SLICE_SRC);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  drawContain(ctx, image);

  drawStroke(ctx, input.scarStroke);

  const scar = toPx(input.scarPoint);
  ctx.save();
  ctx.fillStyle = "rgba(239, 68, 68, 0.62)";
  ctx.strokeStyle = "#7f1d1d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(scar.x, scar.y, 44, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawLabel(ctx, "рубец / ниша", scar.x, scar.y - 44, "#7f1d1d");

  ctx.save();
  ctx.fillStyle = "#111827";
  ctx.beginPath();
  ctx.arc(INTERNAL_OS.x, INTERNAL_OS.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawLabel(ctx, "внутр. зев", INTERNAL_OS.x + 70, INTERNAL_OS.y, "#111827");

  if (input.state.scenario === "early_pregnancy") {
    const sac = toPx(input.sacPoint);
    ctx.save();
    ctx.fillStyle = "#fef3c7";
    ctx.strokeStyle = "#b45309";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(sac.x, sac.y, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(sac.x, sac.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#92400e";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(sac.x, sac.y);
    ctx.lineTo(scar.x, scar.y);
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, "плодное яйцо", sac.x, sac.y - 46, "#92400e");
  }

  drawFooter(ctx, input.state);
  return canvas.toDataURL("image/png", 0.92);
}
