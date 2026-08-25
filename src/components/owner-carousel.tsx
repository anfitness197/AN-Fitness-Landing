"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const OWNER_IMAGES = [
  "/assets/images/owner1.webp",
  "/assets/images/owner2.webp",
  "/assets/images/owner3.webp",
];

const FALLBACK_IMAGE = "/assets/images/owner1.webp";
const INTERVAL_MS = 4000;

export default function OwnerCarousel() {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const pausedRef = useRef(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  const activeImages = OWNER_IMAGES.filter((src) => !failed[src]);
  const hasImages = activeImages.length > 0;
  const currentSrc = hasImages ? activeImages[index % activeImages.length] : FALLBACK_IMAGE;

  // Preload ALL images eagerly on mount so transitions never show a loading gap
  useEffect(() => {
    [...OWNER_IMAGES, FALLBACK_IMAGE].forEach((src) => {
      // Preload via link element for browser-level priority
      if (typeof document !== "undefined" && !document.querySelector(`link[href="${src}"]`)) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = src;
        document.head.appendChild(link);
      }
      // Also decode via Image object so the bitmap is ready
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (!hasImages || activeImages.length <= 1) return;
    if (prefersReducedMotion.current) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      setIndex((prev) => (prev + 1) % activeImages.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasImages, activeImages.length]);

  const handleError = useCallback((src: string) => {
    setFailed((prev) => {
      if (prev[src]) return prev;
      return { ...prev, [src]: true };
    });
  }, []);

  useEffect(() => {
    if (index >= activeImages.length && activeImages.length > 0) {
      setIndex(0);
    }
  }, [activeImages.length, index]);

  return (
    <div
      className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[380px] lg:max-w-[400px] aspect-[3/4] shrink-0 relative rounded-2xl overflow-hidden p-[1px] bg-zinc-900 border border-zinc-800 shadow-2xl group"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
      onTouchStart={() => { pausedRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { pausedRef.current = false; }, 3000); }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-brandRed/10 to-transparent pointer-events-none z-10" />
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900">
        {/* Static background layer — always shows current image to prevent any flash */}
        <Image
          src={currentSrc}
          alt=""
          fill
          sizes="(max-width: 640px) 280px, (max-width: 768px) 380px, 400px"
          className="object-cover filter brightness-95 contrast-105"
          draggable={false}
          aria-hidden
        />
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentSrc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={currentSrc}
              alt="Anil Mahapatra - Founder of AN Fitness"
              fill
              sizes="(max-width: 640px) 280px, (max-width: 768px) 380px, 400px"
              className="object-cover filter brightness-95 contrast-105"
              draggable={false}
              priority={index === 0}
              onError={() => {
                if (currentSrc !== FALLBACK_IMAGE) handleError(currentSrc);
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {hasImages && activeImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
          {activeImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`View owner image ${i + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${i === index % activeImages.length ? "w-6 h-1.5 bg-brandRed" : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
