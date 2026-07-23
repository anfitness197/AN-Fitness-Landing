"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Maximize2, Minimize2, Loader2, ImageOff } from "lucide-react";

interface GalleryItem {
  id: string;
  url: string;
  category: string;
  title: string;
}

const CATEGORIES = [
  { id: "all", label: "ALL AREAS" },
  { id: "strength", label: "STRENGTH DECK" },
  { id: "facility", label: "GYM FACILITY" },
];

const GALLERY_CACHE_KEY = "an_gallery_cache";
const GALLERY_CACHE_TTL = 5 * 60 * 1000;

const GalleryImage: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = "" }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full bg-zinc-900 overflow-hidden">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <Loader2 size={18} className="animate-spin text-zinc-700" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 p-2 text-center">
          <ImageOff size={20} className="text-zinc-700 mb-1" />
          <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">Image Unavailable</span>
        </div>
      ) : (
        
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`${className} object-cover w-full h-full transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    async function loadGallery() {
      try {
        const cached = sessionStorage.getItem(GALLERY_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < GALLERY_CACHE_TTL && Array.isArray(parsed.data)) {
            setPhotos(parsed.data);
            setLoading(false);

            const res = await fetch("/api/gallery");
            const freshData = await res.json();
            if (res.ok && Array.isArray(freshData)) {
              setPhotos(freshData);
              sessionStorage.setItem(
                GALLERY_CACHE_KEY,
                JSON.stringify({ data: freshData, timestamp: Date.now() })
              );
            }
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/gallery");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setPhotos(data);
          try {
            sessionStorage.setItem(
              GALLERY_CACHE_KEY,
              JSON.stringify({ data, timestamp: Date.now() })
            );
          } catch {}
        } else {
          setPhotos([]);
        }
      } catch (err) {
        console.error("Failed to load gallery data:", err);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const filteredPhotos = selectedCategory === "all"
    ? photos
    : photos.filter(p => p.category.toLowerCase() === selectedCategory.toLowerCase());

  
  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setLightboxIndex(null);
  };

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [lightboxIndex]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : null));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredPhotos.length : null));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxIndex, filteredPhotos.length]);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const closeLightbox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setLightboxIndex(null);
  };

  const currentPhoto = lightboxIndex !== null && filteredPhotos[lightboxIndex] ? filteredPhotos[lightboxIndex] : null;

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between overflow-x-hidden text-white pt-20 sm:pt-24 pb-12 sm:pb-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] bg-brandRed/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col gap-6 sm:gap-10">
        <div className="self-start">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-widest">
            <ChevronLeft size={14} />
            BACK TO DECK
          </Link>
        </div>

        <div className="text-left flex flex-col gap-2 sm:gap-3">
          <span className="text-[9px] sm:text-[10px] text-brandRed font-mono font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] bg-brandRed/10 px-3 py-1 rounded self-start">
            FACILITY PREVIEW
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-6xl text-white uppercase tracking-tight leading-none">
            THE AN CORE CATALOG
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm md:text-base max-w-xl font-light">
            Browse our raw workout deck layouts, combat training cages, clean recovery saunas, and custom facilities.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-900 pb-3 sm:pb-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black tracking-widest uppercase transition-all duration-300 border cursor-pointer ${selectedCategory === cat.id
                ? "bg-brandRed border-brandRed text-white shadow-lg shadow-brandRed/20"
                : "bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
            <Loader2 size={28} className="animate-spin text-brandRed" />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-mono text-zinc-600">Retrieving Asset Index...</span>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-20 text-center border border-zinc-900 rounded-2xl sm:rounded-3xl bg-zinc-900/5">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-mono text-zinc-500">No media uploaded in this zone yet</span>
            <p className="text-zinc-650 text-[10px] sm:text-xs font-light mt-1">Check back later for high-definition visuals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredPhotos.map((photo, index) => (
              <div
                key={photo.id}
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-900/80 hover:border-zinc-800 shadow-xl cursor-pointer transition-all duration-300"
              >
                <GalleryImage
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95 group-hover:brightness-100"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-5 pointer-events-none" />

                <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-5 z-10 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-between items-center gap-2 sm:gap-3 pointer-events-none">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[7px] sm:text-[8px] font-mono font-bold tracking-widest text-brandRed uppercase leading-none mb-1">
                      {photo.category}
                    </span>
                    <h3 className="text-[10px] sm:text-xs font-black text-white uppercase leading-none truncate">
                      {photo.title}
                    </h3>
                  </div>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    <Maximize2 size={10} className="text-zinc-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {currentPhoto && (
        <div 
          onClick={closeLightbox}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6"
        >

          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-6xl flex justify-between items-center z-[110]"
          >
            <div className="flex flex-col">
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-brandRed uppercase font-bold">
                {currentPhoto.category}
              </span>
              <h2 className="text-xs sm:text-sm font-black uppercase text-white truncate max-w-xs sm:max-w-md">
                {currentPhoto.title || "AN FITNESS GALLERY"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-brandRed hover:bg-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                aria-label="Toggle Fullscreen"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>

              <button
                onClick={closeLightbox}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-zinc-900 border border-zinc-800 hover:border-brandRed hover:bg-brandRed hover:border-brandRed flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                aria-label="Close Lightbox"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[78vh] w-full flex-1 flex items-center justify-center my-auto p-2"
          >

            <img
              src={currentPhoto.url}
              alt={currentPhoto.title || "Gallery Preview"}
              className="max-w-full max-h-[75vh] object-contain rounded-xl sm:rounded-2xl select-none shadow-2xl border border-zinc-800/50"
            />

            {filteredPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex! - 1 + filteredPhotos.length) % filteredPhotos.length);
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:border-brandRed hover:bg-brandRed text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex! + 1) % filteredPhotos.length);
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:border-brandRed hover:bg-brandRed text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
                  aria-label="Next photo"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          <div className="text-center z-[110]">
            <span className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest">
              {lightboxIndex! + 1} / {filteredPhotos.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

