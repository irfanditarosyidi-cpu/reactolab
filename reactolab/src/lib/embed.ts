import { getYouTubeEmbedUrl } from "@/lib/youtube";

function iframeSource(input: string): string {
  return input.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? input;
}

/** Normalize links and iframe snippets to a safe public HTTP(S) URL. */
export function normalizeHttpUrl(input: string): string | null {
  const raw = iframeSource(input.trim()).replace(/&amp;/g, "&").trim();
  if (!raw) return null;

  try {
    const candidate = /^(https?:)?\/\//i.test(raw)
      ? raw.startsWith("//")
        ? `https:${raw}`
        : raw
      : `https://${raw}`;
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Convert common sharing URLs to their player/preview form. Unknown HTTP(S)
 * links are returned unchanged so every valid link gets an iframe attempt.
 */
export function getEmbedUrl(input: string): string | null {
  const normalized = normalizeHttpUrl(input);
  if (!normalized) return null;

  const youtube = getYouTubeEmbedUrl(normalized);
  if (youtube) return youtube;

  const url = new URL(normalized);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
    const videoId = parts.find((part) => /^\d+$/.test(part));
    if (videoId) return `https://player.vimeo.com/video/${videoId}`;
  }

  if (host === "drive.google.com") {
    const fileIndex = parts.indexOf("d");
    const fileId = fileIndex >= 0 ? parts[fileIndex + 1] : url.searchParams.get("id");
    if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
  }

  if (host === "docs.google.com") {
    const kind = parts[0];
    const idIndex = parts.indexOf("d");
    const documentId = idIndex >= 0 ? parts[idIndex + 1] : null;
    if (documentId && kind === "document") {
      return `https://docs.google.com/document/d/${documentId}/preview`;
    }
    if (documentId && kind === "spreadsheets") {
      return `https://docs.google.com/spreadsheets/d/${documentId}/preview`;
    }
    if (documentId && kind === "presentation") {
      return `https://docs.google.com/presentation/d/${documentId}/embed`;
    }
    if (kind === "forms") {
      url.searchParams.set("embedded", "true");
      return url.toString();
    }
  }

  if (host === "open.spotify.com" && parts[0] !== "embed") {
    return `https://open.spotify.com/embed/${parts.join("/")}`;
  }

  if (host === "instagram.com" && ["p", "reel", "tv"].includes(parts[0] ?? "")) {
    return `https://www.instagram.com/${parts[0]}/${parts[1]}/embed/`;
  }

  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const videoIndex = parts.indexOf("video");
    const videoId = videoIndex >= 0 ? parts[videoIndex + 1] : null;
    if (videoId && /^\d+$/.test(videoId)) {
      return `https://www.tiktok.com/player/v1/${videoId}`;
    }
  }

  if (host === "canva.com" || host.endsWith(".canva.com")) {
    url.searchParams.set("embed", "");
    return url.toString();
  }

  return normalized;
}
