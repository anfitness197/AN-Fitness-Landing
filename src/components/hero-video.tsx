"use client";

import React, { useEffect, useRef } from "react";

export const HeroVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const playVideo = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };

    const handlePreloaderDone = () => {
      playVideo();
    };

    window.addEventListener("preloader-done", handlePreloaderDone, { passive: true });
    window.addEventListener("preloader-exit-start", handlePreloaderDone, { passive: true });

    return () => {
      window.removeEventListener("preloader-done", handlePreloaderDone);
      window.removeEventListener("preloader-exit-start", handlePreloaderDone);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      preload="metadata"
      poster="/assets/hero/hero-poster.webp"
      className="absolute inset-0 w-full h-full object-cover scale-105"
    >
      <source src="/assets/hero/hero-1080p.webm" type="video/webm" />
      <source src="/assets/hero/hero-1080p.mp4" type="video/mp4" />
    </video>
  );
};

export default HeroVideo;
