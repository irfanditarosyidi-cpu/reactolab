"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { getEmbedUrl, normalizeHttpUrl } from "@/lib/embed";
import { cn } from "@/lib/utils";

export default function EmbeddedLink({
  url,
  title,
  className,
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const embedUrl = getEmbedUrl(url);
  const publicUrl = normalizeHttpUrl(url);
  const [loading, setLoading] = useState(true);

  useEffect(() => setLoading(true), [embedUrl]);

  if (!embedUrl || !publicUrl) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
        Link tidak valid dan tidak dapat ditampilkan.
      </div>
    );
  }

  let hostname = "Sumber eksternal";
  try {
    hostname = new URL(publicUrl).hostname.replace(/^www\./, "");
  } catch {
    // The validated URL above already provides the invalid-link fallback.
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-700">{hostname}</p>
          <p className="truncate text-[10px] text-slate-400">{publicUrl}</p>
        </div>
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Buka
        </a>
      </div>
      <div className={cn("relative h-80 bg-slate-100 sm:h-[420px]", className)}>
        {loading && (
          <div className="absolute inset-0 grid place-items-center text-center text-xs font-semibold text-slate-500">
            Memuat tampilan link…
          </div>
        )}
        <iframe
          key={embedUrl}
          src={embedUrl}
          title={title}
          loading="lazy"
          className="relative h-full w-full bg-white"
          sandbox="allow-downloads allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          onLoad={() => setLoading(false)}
        />
      </div>
      <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
        Jika sumber menolak tampil di dalam halaman, gunakan tombol <b>Buka</b>. Hal
        tersebut ditentukan oleh kebijakan keamanan situs sumber.
      </p>
    </div>
  );
}
