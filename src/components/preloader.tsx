"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

interface PreloaderProps {
  isPageReady: boolean;
  onComplete: () => void;
  onExitStart?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ isPageReady, onComplete, onExitStart }) => {
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);

  const finishPreloader = useCallback(() => {
    setIsDone(true);
    document.documentElement.classList.add("preloader-exit-start");
    window.dispatchEvent(new CustomEvent("preloader-exit-start"));
    if (onExitStart) {
      onExitStart();
    }
  }, [onExitStart]);

  // Asset preloading effect
  useEffect(() => {
    let active = true;
    const assets = [
      { url: "/assets/logos/favicon.svg", type: "image" },
      { url: "/assets/hero/hero-1080p.webm", type: "video" },
      { url: "/assets/images/OWNER.webp", type: "image" },
      { url: "/assets/images/zumba.webp", type: "image" },
      { url: "/assets/images/workout.webp", type: "image" },
      { url: "/assets/images/pt.webp", type: "image" },
    ];

    let loadedCount = 0;
    const totalAssets = assets.length;

    const handleAssetLoaded = () => {
      if (!active) return;
      loadedCount++;
      const assetProgress = Math.round((loadedCount / totalAssets) * 90);
      setProgress((prev) => Math.max(prev, assetProgress));
    };

    // Helper for images
    const loadImage = (url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          handleAssetLoaded();
          resolve();
        };
        img.onerror = () => {
          handleAssetLoaded();
          resolve();
        };
      });
    };

    // Helper for video
    const loadVideo = (url: string) => {
      return new Promise<void>((resolve) => {
        const video = document.createElement("video");
        video.src = url;
        video.preload = "auto";
        video.muted = true;
        video.playsInline = true;

        const onCanPlay = () => {
          handleAssetLoaded();
          resolve();
          video.removeEventListener("canplaythrough", onCanPlay);
          video.removeEventListener("loadeddata", onCanPlay);
        };

        video.addEventListener("canplaythrough", onCanPlay, { once: true });
        video.addEventListener("loadeddata", onCanPlay, { once: true });

        // Safety timeout to prevent getting stuck
        setTimeout(() => {
          if (active) {
            onCanPlay();
          }
        }, 3000);
      });
    };

    // Start parallel preload
    Promise.all(
      assets.map((asset) => {
        if (asset.type === "image") {
          return loadImage(asset.url);
        } else {
          return loadVideo(asset.url);
        }
      })
    );

    // Fallback slow interval (trickle) so user is not stuck on 0
    const fallbackInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(fallbackInterval);
          return 90;
        }
        return prev + 1;
      });
    }, 150);

    return () => {
      active = false;
      clearInterval(fallbackInterval);
    };
  }, []);

  // Completion check
  useEffect(() => {
    if (isPageReady && progress >= 90) {
      setProgress(100);
      const timer = setTimeout(() => {
        finishPreloader();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isPageReady, progress, finishPreloader]);

  // Clean-up/OnComplete trigger
  useEffect(() => {
    if (isDone) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800); // Match door animation duration exactly (0.8s)
      return () => clearTimeout(timer);
    }
  }, [isDone, onComplete]);

  // Global safety timeout
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setProgress(100);
      finishPreloader();
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(finishTimer);
    }, 6000);

    return () => clearTimeout(safetyTimer);
  }, [onComplete, finishPreloader]);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden flex pointer-events-none"
      aria-hidden="true"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isDone ? "-100%" : 0 }}
        transition={{ duration: 0.8, ease: [0.85, 0, 0.15, 1] }}
        style={{ willChange: "transform" }}
        className="relative w-1/2 h-full bg-zinc-950 pointer-events-auto"
      >
        <motion.div
          className="absolute left-[100%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none flex items-center justify-center"
          style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }}
          animate={isDone ? { opacity: 1 } : { opacity: [0.3, 1, 0.3] }}
          transition={isDone ? { duration: 0.15 } : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/favicon.svg"
            alt=""
            className="w-32 h-32 object-contain filter drop-shadow-[0_0_20px_rgba(214,26,31,0.6)]"
          />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isDone ? "100%" : 0 }}
        transition={{ duration: 0.8, ease: [0.85, 0, 0.15, 1] }}
        style={{ willChange: "transform" }}
        className="relative w-1/2 h-full bg-zinc-950 pointer-events-auto"
      >
        <motion.div
          className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none flex items-center justify-center"
          style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }}
          animate={isDone ? { opacity: 1 } : { opacity: [0.3, 1, 0.3] }}
          transition={isDone ? { duration: 0.15 } : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logos/favicon.svg"
            alt=""
            className="w-32 h-32 object-contain filter drop-shadow-[0_0_20px_rgba(214,26,31,0.6)]"
          />
        </motion.div>
      </motion.div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isDone ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center justify-center"
        >
          <div className="w-48 h-48" />

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="w-24 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-brandRed rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
            <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-[0.45em]">
              {progress < 100 ? "LOADING..." : "READY"}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Preloader;
