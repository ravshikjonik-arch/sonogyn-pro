import { SPEECH_ALLOWED_MIME, SPEECH_TRANSCRIBE_MAX_BYTES } from "./constants";

export type AudioValidationResult =
  | { ok: true; mime: string }
  | { ok: false; reason: string };

function sniffMime(buf: Uint8Array): string | null {
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return "audio/webm";
  }
  if (buf.length >= 4 && buf[0] === 0x4f && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) {
    return "audio/ogg";
  }
  if (buf.length >= 12 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    return "audio/wav";
  }
  if (buf.length >= 8 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    return "audio/mp4";
  }
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) {
    return "audio/mpeg";
  }
  return null;
}

export function validateSpeechAudioUpload(params: {
  bytes: Uint8Array;
  declaredMime: string | null;
}): AudioValidationResult {
  const { bytes, declaredMime } = params;
  if (bytes.byteLength === 0) return { ok: false, reason: "empty_audio" };
  if (bytes.byteLength > SPEECH_TRANSCRIBE_MAX_BYTES) {
    return { ok: false, reason: "audio_too_large" };
  }

  const sniffed = sniffMime(bytes);
  const declared = declaredMime?.split(";")[0]?.trim().toLowerCase() ?? "";
  const mime = (sniffed ?? declared).toLowerCase();
  if (!mime || !SPEECH_ALLOWED_MIME.has(mime)) {
    return { ok: false, reason: "unsupported_audio_type" };
  }
  if (sniffed && declared && sniffed !== declared && SPEECH_ALLOWED_MIME.has(declared)) {
    return { ok: false, reason: "audio_magic_mismatch" };
  }

  return { ok: true, mime };
}
