const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function validVideoId(value: string | null | undefined): string | null {
  const id = value?.trim() ?? "";
  return VIDEO_ID_PATTERN.test(id) ? id : null;
}

/**
 * Accepts a video ID, a normal/share/embed YouTube URL, or an iframe snippet.
 * Only the validated 11-character video ID is returned.
 */
export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const directId = validVideoId(trimmed);
  if (directId) return directId;

  const iframeSrc = trimmed.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1];
  const candidate = (iframeSrc ?? trimmed).replace(/&amp;/g, "&");

  try {
    const withProtocol = /^(https?:)?\/\//i.test(candidate)
      ? candidate.startsWith("//")
        ? `https:${candidate}`
        : candidate
      : `https://${candidate}`;
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      return validVideoId(url.pathname.split("/").filter(Boolean)[0]);
    }

    const isYouTube =
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com");
    if (!isYouTube) return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live"].includes(parts[0] ?? "")) {
      return validVideoId(parts[1]);
    }
    return validVideoId(url.searchParams.get("v"));
  } catch {
    return null;
  }
}

export function getYouTubeEmbedUrl(input: string): string | null {
  const id = extractYouTubeVideoId(input);
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`
    : null;
}

export function getYouTubeThumbnailUrl(input: string): string | null {
  const id = extractYouTubeVideoId(input);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}
