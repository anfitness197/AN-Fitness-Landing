"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Loader2, ImageOff, Play } from "lucide-react";
import { getMediaThumbnail, isVideoUrl, optimizeMediaUrl, getVideoPlaybackUrl } from "@/lib/cloudinary";
import { EmptyState } from "@/components/empty-state";

interface GalleryItem { id: string; url: string; category: string; title: string; type?: string; }

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "videos", label: "Videos" },
  { id: "photos", label: "Photos" },
  { id: "strength", label: "Strength floor" },
  { id: "facility", label: "Gym facility" },
];

const GalleryImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = "" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const optimized = optimizeMediaUrl(src, 800);
  useEffect(() => { setLoaded(false); setError(false); }, [optimized]);
  useEffect(() => { const img = imgRef.current; if (img?.complete && img.naturalWidth > 0) setLoaded(true); }, [optimized]);
  return (
    <div className="relative w-full h-full bg-zinc-900 overflow-hidden">
      {!loaded && !error && <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center"><Loader2 size={18} className="animate-spin text-zinc-700" /></div>}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-2 text-center"><ImageOff size={20} className="text-zinc-700 mb-1" /><span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">Image Unavailable</span></div>
      ) : (
        <Image ref={imgRef} src={optimized} alt={alt} fill unoptimized decoding="async" referrerPolicy="no-referrer" className={`${className} object-cover w-full h-full transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`} onLoad={() => setLoaded(true)} onError={() => setError(true)} />
      )}
    </div>
  );
};

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const filtered = items.filter((p) => {
    const isVideo = isVideoUrl(p.url, p.type);
    if (selectedCategory === "all") return true;
    if (selectedCategory === "videos") return isVideo;
    if (selectedCategory === "photos") return !isVideo;
    return (p.category || "").toLowerCase() === selectedCategory.toLowerCase();
  });

  useEffect(() => {
    if (lightboxIndex !== null) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [lightboxIndex]);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const kd = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") setLightboxIndex((prev) => prev !== null ? (prev - 1 + filtered.length) % filtered.length : null);
      else if (e.key === "ArrowRight") setLightboxIndex((prev) => prev !== null ? (prev + 1) % filtered.length : null);
    };
    window.addEventListener("keydown", kd);
    return () => window.removeEventListener("keydown", kd);
  }, [lightboxIndex, filtered.length]);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };
  const closeLightbox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setLightboxIndex(null);
  };
  const current = lightboxIndex !== null && filtered[lightboxIndex] ? filtered[lightboxIndex] : null;

  if (!items.length) return <EmptyState title="No photos yet" description="Check back later for new photos and videos." />;

  return (
    <>
      <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-3 sm:pb-4">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setLightboxIndex(null); }}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 border cursor-pointer ${selectedCategory === cat.id ? "bg-brandRed border-brandRed text-white shadow-lg shadow-brandRed/20" : "bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No photos in this category yet" description="Check back later for new photos and videos." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filtered.map((photo, index) => {
            const isVideo = isVideoUrl(photo.url, photo.type);
            const thumb = getMediaThumbnail(photo.url, photo.type);
            return (
              <div key={photo.id} onClick={() => setLightboxIndex(index)} className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-900/80 hover:border-zinc-800 shadow-xl cursor-pointer transition-all duration-300">
                {isVideo ? (
                  <div className="w-full h-full relative bg-black">
                    <GalleryImage src={thumb} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90 group-hover:brightness-100" />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-brandRed/90 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/20 group-hover:scale-110 transition-transform"><Play size={18} className="fill-white ml-0.5" /></div>
                    </div>
                    <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md text-brandRed text-[8px] font-mono font-bold px-2 py-0.5 rounded border border-brandRed/30 z-10 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-brandRed animate-pulse" />VIDEO</div>
                  </div>
                ) : (
                  <GalleryImage src={photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-100" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-5 pointer-events-none" />
                <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-5 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-between items-center gap-2 sm:gap-3 pointer-events-none">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7px] sm:text-[8px] font-mono font-bold tracking-widest text-brandRed uppercase leading-none mb-1">{photo.category}</span>
                    <h3 className="text-[10px] sm:text-xs font-black text-white uppercase leading-none truncate">{photo.title}</h3>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0"><Maximize2 size={10} className="text-zinc-400" /></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {current && (
        <div onClick={closeLightbox} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-6xl flex justify-between items-center z-[110]">
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-brandRed uppercase font-bold">{current.category}</span>
              <h2 className="text-xs sm:text-sm font-black uppercase text-white truncate max-w-xs sm:max-w-md">{current.title || "AN FITNESS GALLERY"}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleFullscreen} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-brandRed hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer" aria-label="Toggle Fullscreen">{isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
              <button onClick={closeLightbox} className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-brandRed hover:bg-brandRed hover:border-brandRed flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer" aria-label="Close Lightbox"><X size={20} /></button>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-5xl max-h-[78vh] w-full flex-1 flex items-center justify-center my-auto p-2">
            {current.type === "video" || /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(current.url) || current.url.includes("/video/upload/") ? (
              <video src={getVideoPlaybackUrl(current.url)} controls autoPlay loop muted playsInline className="max-w-full max-h-[75vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl border border-zinc-800/50" />
            ) : (
              <Image src={optimizeMediaUrl(current.url, 1280)} alt={current.title || "Gallery Preview"} width={1280} height={800} unoptimized className="max-w-full max-h-[75vh] object-contain rounded-xl sm:rounded-2xl select-none shadow-2xl border border-zinc-800/50" />
            )}
            {filtered.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex! - 1 + filtered.length) % filtered.length); }} className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:border-brandRed hover:bg-brandRed text-white flex items-center justify-center transition-all cursor-pointer shadow-lg" aria-label="Previous photo"><ChevronLeft size={20} /></button>
                <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex! + 1) % filtered.length); }} className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:border-brandRed hover:bg-brandRed text-white flex items-center justify-center transition-all cursor-pointer shadow-lg" aria-label="Next photo"><ChevronRight size={20} /></button>
              </>
            )}
          </div>
          <div className="text-center z-[110]"><span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest">{lightboxIndex! + 1} / {filtered.length}</span></div>
        </div>
      )}
    </>
  );
}
