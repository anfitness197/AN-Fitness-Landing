"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface FeatureItem {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const FEATURES_DATA: FeatureItem[] = [
  {
    title: "ZUMBA PARTY",
    subtitle: "DANCE & FITNESS",
    description: "High-energy dance classes combining Latin rhythms with cardio conditioning. Ditch the workout, join the party!",
    image: "/assets/images/zumba.webp",
  },
  {
    title: "STRENGTH & WORKOUT",
    subtitle: "HEAVY IRON TRAINING",
    description: "Build raw power and endurance. Access our premium cages, squat racks, free weights, and modern lifting decks.",
    image: "/assets/images/workout.webp",
  },
  {
    title: "PERSONAL COACHING",
    subtitle: "ELITE 1-ON-1 TRAINING",
    description: "Tailored programs from certified coaches. Get custom form corrections, progression tracking, and nutrition guidance.",
    image: "/assets/images/pt.webp",
  },
];

const FeatureImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative w-full h-full">
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-900 animate-shimmer" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
};

export const FeaturesCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

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

  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        let nextScroll = scrollLeft + clientWidth;
        if (nextScroll >= scrollWidth - 10) {
          nextScroll = 0;
        }
        scrollRef.current.scrollTo({ left: nextScroll, behavior: "smooth" });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div
      className="relative w-full max-w-7xl mx-auto px-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 flex justify-between pointer-events-none px-1 sm:px-6">
        <button
          onClick={() => scroll("left")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-brandRed text-white flex items-center justify-center pointer-events-auto hover:bg-brandRed hover:text-white transition-all duration-300 shadow-lg backdrop-blur-sm"
          aria-label="Previous Slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => scroll("right")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-brandRed text-white flex items-center justify-center pointer-events-auto hover:bg-brandRed hover:text-white transition-all duration-300 shadow-lg backdrop-blur-sm"
          aria-label="Next Slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-4 sm:gap-6 scrollbar-none snap-x snap-mandatory scroll-smooth pb-6 px-2 sm:px-4"
      >
        {FEATURES_DATA.map((item, index) => (
          <div
            key={index}
            className="group relative overflow-hidden p-[1.5px] rounded-2xl w-[250px] xs:w-[270px] sm:w-[360px] shrink-0 bg-zinc-900/60 hover:bg-zinc-800/80 hover:animate-border-glow transition-all duration-300 flex flex-col h-[360px] xs:h-[380px] sm:h-[480px] snap-center select-none"
          >
            <div className="relative w-full h-full bg-zinc-950 rounded-[14px] flex flex-col overflow-hidden">
              <div className="relative w-full h-[72%] overflow-hidden rounded-t-[14px]">
                <FeatureImage src={item.image} alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4">
                  <span className="text-[9px] sm:text-[10px] bg-brandRed text-white px-2 sm:px-2.5 py-0.5 rounded font-black tracking-widest uppercase font-mono">
                    {item.subtitle}
                  </span>
                </div>
              </div>

              <div className="w-full h-[28%] bg-zinc-950 px-4 sm:px-5 py-3 sm:py-4 flex flex-col justify-center border-t border-zinc-900/50 rounded-b-[14px] z-10">
                <h3 className="font-heading font-black text-base sm:text-lg text-white uppercase tracking-wider">
                  {item.title}
                </h3>
                <p className="text-zinc-500 text-[10px] sm:text-xs mt-1 sm:mt-1.5 leading-relaxed font-light line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 sm:gap-2 mt-4">
        {FEATURES_DATA.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (scrollRef.current) {
                const width = scrollRef.current.clientWidth;
                scrollRef.current.scrollTo({ left: index * width, behavior: "smooth" });
              }
            }}
            className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === index ? "w-5 sm:w-6 bg-brandRed" : "w-1.5 sm:w-2 bg-zinc-800 hover:bg-zinc-700"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
