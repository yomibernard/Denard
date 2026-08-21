"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export function MediaVideo({
  src,
  poster,
  label,
  className,
}: {
  src: string;
  poster?: string;
  label?: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <div className={cn("absolute inset-0", className)}>
      <video
        ref={ref}
        className="h-full w-full object-cover object-center"
        autoPlay
        muted
        loop
        playsInline
        poster={poster}
        aria-label={label}
      >
        <source src={src} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        className="absolute bottom-3 right-3 z-10 flex h-9 w-9 items-center justify-center bg-surface/90 text-ink shadow-sm"
        aria-label={playing ? "Pause video" : "Play video"}
      >
        {playing ? <Pause className="h-4 w-4" strokeWidth={1.75} /> : <Play className="h-4 w-4" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
