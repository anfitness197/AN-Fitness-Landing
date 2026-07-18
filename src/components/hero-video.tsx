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

    const checkPreloader = () => {
      const isDone = document.documentElement.classList.contains("preloader-done") ||
                     document.documentElement.classList.contains("preloader-exit-start");
      if (isDone) {
        playVideo();
        return true;
      }
      return false;
    };

    if (checkPreloader()) return;

    const handlePreloaderDone = () => {
      playVideo();
    };

    window.addEventListener("preloader-done", handlePreloaderDone);
    window.addEventListener("preloader-exit-start", handlePreloaderDone);

    const interval = setInterval(() => {
      if (checkPreloader()) {
        clearInterval(interval);
      }
    }, 100);

    return () => {
      window.removeEventListener("preloader-done", handlePreloaderDone);
      window.removeEventListener("preloader-exit-start", handlePreloaderDone);
      clearInterval(interval);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      loop
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover scale-105"
    >
      <source src="/assets/hero/hero-1080p.webm" type="video/webm" />
      <source src="/assets/hero/hero-1080p.mp4" type="video/mp4" />
    </video>
  );
};

export default HeroVideo;
