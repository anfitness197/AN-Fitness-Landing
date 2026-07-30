"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";

const DISMISS_KEY = "an_media_banner_dismissed";
const SESSION_KEY = "an_media_banner_session";

interface MediaBannerData {
  id: string;
  active: number;
  mediaUrl: string;
  mediaType: "video" | "audio";
  width?: number;
  height?: number;
  expiresAt?: string | null;
}

function isPreloaderDone() {
  return (
    document.documentElement.classList.contains("preloader-done") ||
    document.documentElement.classList.contains("preloader-exit-start")
  );
}

function isDismissed(id: string) {
  try {
    if (localStorage.getItem(DISMISS_KEY) === id) return true;
    if (sessionStorage.getItem(SESSION_KEY) === id) return true;
  } catch {
    
  }
  return false;
}

export const MediaBanner: React.FC = () => {
  const [banner, setBanner] = useState<MediaBannerData | null>(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const close = useCallback((permanent = false) => {
    setVisible(false);
    setPlaying(false);
    const el = mediaRef.current;
    if (el) {
      el.pause();
    }
    document.body.style.overflow = "";
    if (!banner?.id) return;
    try {
      if (permanent) {
        localStorage.setItem(DISMISS_KEY, banner.id);
      } else {
        sessionStorage.setItem(SESSION_KEY, banner.id);
      }
    } catch {
      
    }
  }, [banner?.id]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/media-banner");
        const data = await res.json();
        if (cancelled || !res.ok) return;
        if (
          data?.active !== 1 ||
          !data?.mediaUrl ||
          !data?.id ||
          (data.expiresAt && Date.parse(data.expiresAt) <= Date.now())
        ) {
          return;
        }
        if (isDismissed(data.id)) return;
        setBanner({
          id: data.id,
          active: 1,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType === "audio" ? "audio" : "video",
          width: data.width,
          height: data.height,
          expiresAt: data.expiresAt ?? null,
        });
      } catch {
        
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!banner) return;

    const open = () => {
      if (isDismissed(banner.id)) return;
      setVisible(true);
      document.body.style.overflow = "hidden";
    };

    if (isPreloaderDone()) {
      
      const t = setTimeout(open, 200);
      return () => clearTimeout(t);
    }

    const onDone = () => open();
    window.addEventListener("preloader-done", onDone);
    window.addEventListener("preloader-exit-start", onDone);
    return () => {
      window.removeEventListener("preloader-done", onDone);
      window.removeEventListener("preloader-exit-start", onDone);
    };
  }, [banner]);

  useEffect(() => {
    if (!visible) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, close]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const tryPlay = useCallback(async () => {
    const el = mediaRef.current;
    if (!el) return;
    try {
      await el.play();
      setPlaying(true);
      setNeedsGesture(false);
    } catch {
      setNeedsGesture(true);
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    if (!visible || !banner) return;
    if (banner.mediaType === "audio") {
      
      setNeedsGesture(true);
      return;
    }
    
    setMuted(true);
    const el = mediaRef.current as HTMLVideoElement | null;
    if (el) {
      el.muted = true;
    }
    const t = setTimeout(() => {
      tryPlay();
    }, 50);
    return () => clearTimeout(t);
  }, [visible, banner, tryPlay]);

  if (!visible || !banner) return null;

  const isAudio = banner.mediaType === "audio";

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Promo media"
      onClick={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
    >
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 p-4 sm:p-6 pointer-events-none">
        <button
          type="button"
          onClick={() => close(true)}
          className="pointer-events-auto text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 bg-zinc-950/80 backdrop-blur-sm px-3 py-2 rounded-full transition-colors cursor-pointer"
        >
          Don&apos;t show again
        </button>
        <button
          type="button"
          onClick={() => close(false)}
          aria-label="Close"
          className="pointer-events-auto w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-700 hover:border-brandRed text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-8 pt-20 pb-24">
        {isAudio ? (
          <div className="flex flex-col items-center gap-6 max-w-md w-full">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-brandRed/15 border border-brandRed/30 flex items-center justify-center">
              <img
                src="/assets/logos/favicon.svg"
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </div>
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={banner.mediaUrl}
              preload="auto"
              onEnded={() => setPlaying(false)}
              onError={() => close(false)}
              onPlay={() => {
                setPlaying(true);
                setNeedsGesture(false);
              }}
              onPause={() => setPlaying(false)}
              className="w-full"
              controls
            />
            {needsGesture && !playing && (
              <button
                type="button"
                onClick={tryPlay}
                className="inline-flex items-center gap-2 bg-brandRed hover:bg-brandRed-light text-white font-black tracking-widest text-xs uppercase px-6 py-3 rounded-full cursor-pointer"
              >
                <Play size={14} className="fill-white" />
                Play audio
              </button>
            )}
          </div>
        ) : (
          <>
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={banner.mediaUrl}
              playsInline
              muted={muted}
              preload="auto"
              className="max-w-full max-h-full w-auto h-auto object-contain"
              style={
                banner.width && banner.height
                  ? { aspectRatio: `${banner.width} / ${banner.height}` }
                  : undefined
              }
              onEnded={() => setPlaying(false)}
              onError={() => close(false)}
              onPlay={() => {
                setPlaying(true);
                setNeedsGesture(false);
              }}
              onPause={() => setPlaying(false)}
            />
            {needsGesture && (
              <button
                type="button"
                onClick={tryPlay}
                aria-label="Play"
                className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brandRed/90 border border-white/20 text-white flex items-center justify-center shadow-2xl cursor-pointer"
              >
                <Play size={28} className="fill-white ml-1" />
              </button>
            )}
          </>
        )}
      </div>

      {!isAudio && (
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-3 p-4 sm:p-6 pointer-events-none">
          <button
            type="button"
            onClick={() => {
              const el = mediaRef.current;
              if (!el) return;
              if (el.paused) tryPlay();
              else {
                el.pause();
                setPlaying(false);
              }
            }}
            aria-label={playing ? "Pause" : "Play"}
            className="pointer-events-auto w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-700 hover:border-zinc-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="fill-white ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              const el = mediaRef.current as HTMLVideoElement | null;
              if (el) el.muted = next;
            }}
            aria-label={muted ? "Unmute" : "Mute"}
            className="pointer-events-auto w-10 h-10 rounded-full bg-zinc-950/80 border border-zinc-700 hover:border-zinc-500 text-white flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaBanner;
