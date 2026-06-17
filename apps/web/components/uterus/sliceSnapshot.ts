import {
  UTERUS_SAGITTAL_SLICE_SRC,
  enrichAnnotation,
  strokeFromAnnotation,
  type PathologyAnnotation,
  type PathologyType,
} from "@clinical/uterus";

const SNAPSHOT_WIDTH = 1000;
const SNAPSHOT_HEIGHT = 625;

const MARKER_COLORS: Record<PathologyType, string> = {
  myoma: "#7c3aed",
  adenomyosis: "#e11d48",
  polyp: "#0d9488",
  scar: "#475569",
  other: "#2563eb",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Cannot load uterus slice image"));
    img.src = src;
  });
}

function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.min(SNAPSHOT_WIDTH / img.naturalWidth, SNAPSHOT_HEIGHT / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  const x = (SNAPSHOT_WIDTH - w) / 2;
  const y = (SNAPSHOT_HEIGHT - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

function pathFromPoints(points: Array<[number, number]>, ctx: CanvasRenderingContext2D) {
  if (points.length === 0) return;
  ctx.beginPath();
  points.forEach(([nx, ny], index) => {
    const x = nx * SNAPSHOT_WIDTH;
    const y = ny * SNAPSHOT_HEIGHT;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
}

function centerOf(points: Array<[number, number]>): { x: number; y: number } {
  if (points.length === 0) return { x: SNAPSHOT_WIDTH / 2, y: SNAPSHOT_HEIGHT / 2 };
  const sum = points.reduce(
    (acc, [nx, ny]) => ({ x: acc.x + nx, y: acc.y + ny }),
    { x: 0, y: 0 },
  );
  return {
    x: (sum.x / points.length) * SNAPSHOT_WIDTH,
    y: (sum.y / points.length) * SNAPSHOT_HEIGHT,
  };
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.save();
  ctx.font = "700 20px system-ui, -apple-system, Segoe UI, sans-serif";
  const metrics = ctx.measureText(text);
  const padX = 10;
  const padY = 7;
  const w = metrics.width + padX * 2;
  const h = 30;
  const rx = x - w / 2;
  const ry = y - h / 2;
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.beginPath();
  ctx.roundRect(rx, ry, w, h, 12);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + padY / 4);
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, annotations: PathologyAnnotation[]) {
  const myomas = annotations.filter((item) => item.type === "myoma");
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.fillRect(0, SNAPSHOT_HEIGHT - 54, SNAPSHOT_WIDTH, 54);
  ctx.fillStyle = "#0f172a";
  ctx.font = "700 18px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(
    myomas.length > 1
      ? `FIGO · множественные миоматозные узлы (${myomas.length})`
      : "FIGO · схема локализации миомы",
    24,
    SNAPSHOT_HEIGHT - 28,
  );
  ctx.font = "12px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Учебная схема; финальную интерпретацию выполняет специалист.", 24, SNAPSHOT_HEIGHT - 10);
  ctx.restore();
}

export async function generateUterusSliceSnapshotDataUrl(
  annotations: PathologyAnnotation[],
): Promise<string | undefined> {
  if (typeof document === "undefined" || annotations.length === 0) return undefined;

  const img = await loadImage(UTERUS_SAGITTAL_SLICE_SRC);
  const canvas = document.createElement("canvas");
  canvas.width = SNAPSHOT_WIDTH;
  canvas.height = SNAPSHOT_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SNAPSHOT_WIDTH, SNAPSHOT_HEIGHT);
  drawContain(ctx, img);

  annotations.forEach((raw, index) => {
    const annotation = enrichAnnotation(raw);
    const stroke = strokeFromAnnotation(annotation);
    if (!stroke) return;
    const color = MARKER_COLORS[annotation.type];
    pathFromPoints(stroke.points, ctx);
    ctx.fillStyle = `${color}66`;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    const center = centerOf(stroke.points);
    const figo = annotation.figoOverride ?? annotation.figoType;
    const label = annotation.type === "myoma" && figo != null ? `${index + 1}: FIGO ${figo}` : String(index + 1);
    drawLabel(ctx, label, center.x, center.y);
  });

  drawFooter(ctx, annotations.map((item) => enrichAnnotation(item)));
  return canvas.toDataURL("image/png", 0.92);
}
