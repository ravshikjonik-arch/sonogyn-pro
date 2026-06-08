export type UltrasoundImageMetrics = {
  width: number;
  height: number;
  /** Доля тёмных пикселей (анэхогенные зоны) 0–1 */
  darkRatio: number;
  /** Оценка «кольца» периферических зон 0–1 */
  peripheralRingScore: number;
};

/** Простая оценка кадра УЗИ — только для подсказки, не диагностика. */
export async function extractUltrasoundImageMetrics(file: File): Promise<UltrasoundImageMetrics | null> {
  if (!file.type.startsWith("image/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const maxSide = 320;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let dark = 0;
    let peripheral = 0;
    let peripheralDark = 0;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.45;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = (data[i]! + data[i + 1]! + data[i + 2]!) / 3;
        const isDark = lum < 85;
        if (isDark) dark++;
        const dist = Math.hypot(x - cx, y - cy);
        if (dist > r * 0.55 && dist < r) {
          peripheral++;
          if (isDark) peripheralDark++;
        }
      }
    }
    const total = w * h;
    return {
      width: w,
      height: h,
      darkRatio: dark / total,
      peripheralRingScore: peripheral > 0 ? peripheralDark / peripheral : 0,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function extractUltrasoundVideoFrameMetrics(file: File): Promise<UltrasoundImageMetrics | null> {
  if (!file.type.startsWith("video/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    await new Promise<void>((res, rej) => {
      video.onloadeddata = () => res();
      video.onerror = rej;
    });
    video.currentTime = Math.min(1, (video.duration || 2) * 0.35);
    await new Promise<void>((res) => {
      video.onseeked = () => res();
    });
    const w = 320;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 240;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob) return null;
    return extractUltrasoundImageMetrics(new File([blob], "frame.jpg", { type: "image/jpeg" }));
  } finally {
    URL.revokeObjectURL(url);
  }
}
