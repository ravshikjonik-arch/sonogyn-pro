export type ChatUploadResult = {
  storagePath: string;
  mediaType: "image" | "video";
};

export function uploadChatMedia(
  file: File,
  channelId: string,
  onProgress: (ratio: number) => void,
  signal: AbortSignal,
): Promise<ChatUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("scope", "channel");
    form.append("scopeId", channelId);
    form.append("file", file);
    xhr.open("POST", "/api/doctor-chat/media");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort);
    xhr.onload = () => {
      signal.removeEventListener("abort", abort);
      const payload = JSON.parse(xhr.responseText || "null") as
        | { storagePath?: string; mediaType?: "image" | "video"; error?: string }
        | null;
      if (xhr.status < 200 || xhr.status >= 300 || !payload?.storagePath || !payload.mediaType) {
        reject(new Error(payload?.error ?? "Не удалось загрузить файл"));
        return;
      }
      resolve({ storagePath: payload.storagePath, mediaType: payload.mediaType });
    };
    xhr.onerror = () => reject(new Error("Сеть прервала загрузку"));
    xhr.onabort = () => reject(new Error("Загрузка отменена"));
    xhr.send(form);
  });
}
