import { stripImageMetadata } from "@/lib/security/strip-image-metadata";
import { chatMediaTypeFromFile } from "@/lib/supabase/chat-media-storage";

export type PreparedChatMediaUpload =
  | {
      ok: true;
      buffer: Buffer;
      contentType: string;
      mediaType: "image" | "video";
      metadataStripped: boolean;
    }
  | { ok: false; error: string };

/**
 * Server-side chat media: raster images get EXIF/IPTC/XMP stripped; video unchanged.
 */
export async function prepareChatMediaUpload(file: File): Promise<PreparedChatMediaUpload> {
  const mediaType = chatMediaTypeFromFile(file);
  if (!mediaType) {
    return { ok: false, error: "Нужен файл изображения или видео" };
  }

  if (mediaType === "video") {
    return {
      ok: true,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || "application/octet-stream",
      mediaType: "video",
      metadataStripped: false,
    };
  }

  const raw = Buffer.from(await file.arrayBuffer());
  const uploadContentType = file.type || "image/jpeg";
  const stripped = await stripImageMetadata(raw, uploadContentType);
  if (!stripped.ok) {
    return { ok: false, error: stripped.error };
  }

  return {
    ok: true,
    buffer: stripped.buffer,
    contentType: stripped.contentType,
    mediaType: "image",
    metadataStripped: stripped.stripped,
  };
}
