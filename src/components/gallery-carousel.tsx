"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

interface GalleryItem {
  id: string;
  url: string;
  category: string;
  title: string;
  type?: "image" | "video";
}

interface GalleryCarouselProps {
  photos: GalleryItem[];
}

const GalleryImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-zinc-900 animate-shimmer" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Failed to load</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-all duration-700 ease-out group-hover:scale-105 filter brightness-[0.88] ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export const GalleryCarousel: React.FC<GalleryCarouselProps> = ({ photos }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      if (clientWidth > 0) {
        const index = Math.round(scrollLeft / clientWidth);
        setActiveIndex(index);
      }
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest">
        No training media uploaded yet.
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4">
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 flex justify-between pointer-events-none px-1 sm:px-6">
        <button
          onClick={() => scroll("left")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-900 hover:border-brandRed hover:bg-zinc-900 text-white flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-all shadow-xl disabled:opacity-30 cursor-pointer"
          disabled={activeIndex === 0}
          aria-label="Previous Slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => scroll("right")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-900 hover:border-brandRed hover:bg-zinc-900 text-white flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-all shadow-xl disabled:opacity-30 cursor-pointer"
          disabled={activeIndex >= Math.max(0, photos.length - 2)}
          aria-label="Next Slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 scroll-smooth pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {photos.map((photo) => {
          const isVideo = photo.type === "video" || /\.(mp4|webm|mov|ogg|m4v)(\?.*)?$/i.test(photo.url) || photo.url.includes("/video/upload/");
          return (
            <div
              key={photo.id}
              className="w-[240px] xs:w-[260px] sm:w-[285px] md:w-[350px] shrink-0 snap-start snap-always"
            >
              <div className="relative aspect-square overflow-hidden bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-2xl sm:rounded-3xl group shadow-xl transition-all duration-300">
                {isVideo ? (
                  <div className="w-full h-full relative bg-black">
                    <video
                      src={photo.url}
                      className="w-full h-full object-cover filter brightness-[0.88] group-hover:scale-105 transition-transform duration-700"
                      muted
                      autoPlay
                      loop
                      playsInline
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-brandRed/90 backdrop-blur-md flex items-center justify-center text-white shadow-lg border border-white/20 group-hover:scale-110 transition-transform">
                        <Play size={18} className="fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <GalleryImage src={photo.url} alt={photo.title} />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 sm:p-6 flex flex-col justify-end items-start z-10">
                  <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/10 border border-brandRed/20 px-2 py-0.5 rounded uppercase font-bold mb-2">
                    {photo.category}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-white uppercase truncate w-full leading-none tracking-wide">
                    {photo.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-1.5 sm:gap-2 mt-4">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (scrollRef.current) {
                const width = scrollRef.current.clientWidth;
                scrollRef.current.scrollTo({ left: index * width, behavior: "smooth" });
              }
            }}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === index ? "bg-brandRed w-4 sm:w-6" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
