"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { GalleryCarousel } from "./gallery-carousel";

interface GalleryItem {
  id: string;
  url: string;
  category: string;
  title: string;
}

const GALLERY_CACHE_KEY = "an_gallery_cache";
const GALLERY_CACHE_TTL = 5 * 60 * 1000;

export const LandingGallery: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        const res = await fetch("/api/gallery?limit=12");
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
        console.error("Failed to fetch gallery photos:", err);
        setPhotos([]);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 size={28} className="animate-spin text-brandRed" />
          <span className="text-xs uppercase tracking-widest font-mono text-zinc-600">
            Loading Gallery...
          </span>
        </div>
      ) : (
        <>
          <GalleryCarousel photos={photos} />
          {photos.length > 0 && (
            <div className="flex justify-center">
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 border border-zinc-800 hover:border-brandRed bg-zinc-950/80 hover:bg-zinc-900/50 backdrop-blur-sm text-white px-6 sm:px-8 py-3 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all duration-300 group"
              >
                VIEW FULL GALLERY
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LandingGallery;
export { GALLERY_CACHE_KEY, GALLERY_CACHE_TTL };
export type { GalleryItem };
