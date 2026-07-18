"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface OfferCard {
  id: string;
  badge?: string;
  title: string;
  price: string;
  subtitle: string;
  features: string | string[];
  whatsappText: string;
  active: number;
}

export const OffersCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [offers, setOffers] = useState<OfferCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<{
    badge: string;
    text: string;
    active: number;
  } | null>(null);

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
    if (isHovered || offers.length === 0) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        let nextScroll = scrollLeft + clientWidth;
        if (nextScroll >= scrollWidth - 10) {
          nextScroll = 0;
        }
        scrollRef.current.scrollTo({ left: nextScroll, behavior: "smooth" });
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [isHovered, offers]);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((res) => res.json()).catch(() => null),
      fetch("/api/offers").then((res) => res.json()).catch(() => []),
    ]).then(([settingsData, offersData]) => {
      if (settingsData) setAnnouncement(settingsData);
      if (Array.isArray(offersData)) {
        setOffers(offersData.filter((o) => o.active === 1));
      }
      setLoading(false);
    });
  }, []);

  const getWhatsappUrl = (text: string) => {
    return `https://wa.me/919867195346?text=${encodeURIComponent(text)}`;
  };

  return (
    <div
      className="w-full flex flex-col gap-6 sm:gap-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {announcement && announcement.active === 1 && announcement.text && (
        <div className="w-full flex justify-center px-4">
          <div className="relative group overflow-hidden p-[1px] rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 max-w-xl mx-auto shadow-2xl backdrop-blur-md">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-brandRed/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {announcement.badge && (
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-brandRed bg-brandRed/10 px-2 py-0.5 rounded shrink-0">
                {announcement.badge}
              </span>
            )}
            <p className="text-[9px] sm:text-xs text-zinc-300 font-black uppercase tracking-wider sm:tracking-widest leading-none pr-1">
              {announcement.text}
            </p>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-7xl mx-auto px-4">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 flex justify-between pointer-events-none px-1 sm:px-6">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-900 hover:border-brandRed hover:bg-zinc-900 text-white flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-all shadow-xl disabled:opacity-30 cursor-pointer"
            disabled={activeIndex === 0}
            aria-label="Previous Offer"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-900 hover:border-brandRed hover:bg-zinc-900 text-white flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-all shadow-xl disabled:opacity-30 cursor-pointer"
            disabled={activeIndex === offers.length - 1}
            aria-label="Next Offer"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="w-full flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-brandRed/20 border-t-brandRed animate-spin" />
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:gap-6 scroll-smooth pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {offers.map((offer, idx) => {
                const featuresArray = Array.isArray(offer.features)
                  ? offer.features
                  : typeof offer.features === "string"
                  ? (() => {
                      try {
                        const parsed = JSON.parse(offer.features);
                        if (Array.isArray(parsed)) return parsed;
                      } catch {}
                      return offer.features.split("\n").map(f => f.trim()).filter(Boolean);
                    })()
                  : [];

                return (
                  <div
                    key={offer.id || idx}
                    className="w-full md:w-[calc(50%-12px)] shrink-0 snap-start snap-always"
                  >
                    <div className="relative h-full flex flex-col justify-between bg-zinc-900/10 border border-zinc-900/80 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-300 hover:border-zinc-800 bg-gradient-to-b from-zinc-900/30 to-transparent backdrop-blur-sm shadow-xl group">
                      <div>
                        {offer.badge && (
                          <span className="inline-block text-[8px] sm:text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/10 border border-brandRed/20 px-2.5 sm:px-3 py-1 rounded-full uppercase mb-4 sm:mb-6 font-bold">
                            {offer.badge}
                          </span>
                        )}
                        <h3 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-tight leading-none mb-2">
                          {offer.title}
                        </h3>
                        <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                          <span className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-brandRed">{offer.price}</span>
                          <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{offer.subtitle}</span>
                        </div>

                        <div className="w-8 h-[2px] bg-brandRed/60 mb-4 sm:mb-6" />

                        <ul className="flex flex-col gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                          {featuresArray.map((feat, fidx) => (
                            <li key={fidx} className="flex items-start gap-2.5 sm:gap-3 text-zinc-400 text-[11px] sm:text-xs md:text-sm font-light">
                              <Check size={14} className="text-brandRed shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-3 sm:mt-4">
                        <a
                          href={getWhatsappUrl(offer.whatsappText)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 border border-brandRed hover:border-white bg-brandRed/10 hover:bg-brandRed text-white px-4 py-2.5 sm:py-3 rounded-full text-[9px] sm:text-[10px] md:text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-lg text-center"
                          draggable={false}
                        >
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                          CLAIM VIA WHATSAPP
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {offers.length > 1 && (
              <div className="flex justify-center gap-1.5 sm:gap-2 mt-4">
                {offers.map((_, index) => (
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
            )}
          </>
        )}
      </div>
    </div>
  );
};
