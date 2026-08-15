"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { optimizeMediaUrl } from "@/lib/cloudinary";
import { WHATSAPP_NUMBER } from "@/lib/contact";

interface Product {
  id: string;
  name: string;
  image: string;
}

const SHOP_CACHE_KEY = "an_shop_carousel_cache";
const CACHE_TTL = 5 * 60 * 1000;

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const optimized = optimizeMediaUrl(product.image, 500);

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  }, [optimized]);

  const handleEnquire = useCallback(async () => {
    const label = product.name?.trim() ? `"${product.name.trim()}"` : "this product";
    const message = `Hi AN Fitness, I want to buy ${label}. Please send me the details.`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        const response = await fetch(product.image);
        const blob = await response.blob();
        const file = new File([blob], `${product.name || "product"}.jpg`, { type: blob.type || "image/jpeg" });
        const shareData: ShareData & { files?: File[] } = {
          title: product.name || "AN Fitness Product",
          text: message,
        };

        if (navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }

        await navigator.share(shareData);
        return;
      }
    } catch {}

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message + "\n\nProduct image: " + product.image)}`,
      "_blank"
    );
  }, [product]);

  return (
    <div className="group w-[200px] xs:w-[220px] sm:w-[260px] shrink-0 snap-start snap-always">
      <div className="relative aspect-square overflow-hidden bg-zinc-900 border border-zinc-900/80 hover:border-brandRed/50 rounded-2xl group shadow-xl transition-all duration-300">
        {!loaded && <div className="absolute inset-0 bg-zinc-900 animate-shimmer" />}
        <img
          ref={imgRef}
          src={optimized}
          alt={product.name || "AN Fitness Product"}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="pt-3 flex flex-col gap-3">
        <p className="text-xs sm:text-sm font-black text-white uppercase truncate w-full leading-none tracking-wide">
          {product.name?.trim() || "AN Fitness Product"}
        </p>
        <button
          type="button"
          onClick={handleEnquire}
          className="w-full min-h-10 flex items-center justify-center gap-1.5 bg-brandRed hover:bg-brandRed-light text-white px-3 py-2.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer touch-manipulation"
        >
          <ShoppingBag size={11} />
          Enquire Now
        </button>
      </div>
    </div>
  );
};

export const ShopCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      if (clientWidth > 0) setActiveIndex(Math.round(scrollLeft / (clientWidth * 0.6)));
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth * 0.7 : scrollLeft + clientWidth * 0.7;
      scrollRef.current.scrollTo({ left: Math.max(0, scrollTo), behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isHovered || products.length <= 2) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        let nextScroll = scrollLeft + clientWidth * 0.6;
        if (nextScroll >= scrollWidth - clientWidth * 0.3) nextScroll = 0;
        scrollRef.current.scrollTo({ left: nextScroll, behavior: "smooth" });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovered, products.length]);

  useEffect(() => {
    async function load() {
      try {
        const cached = sessionStorage.getItem(SHOP_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < CACHE_TTL && Array.isArray(parsed.data)) {
            setProducts(parsed.data);
            setLoading(false);
            const res = await fetch("/api/products");
            const fresh = await res.json();
            if (res.ok && Array.isArray(fresh)) {
              setProducts(fresh);
              sessionStorage.setItem(SHOP_CACHE_KEY, JSON.stringify({ data: fresh, timestamp: Date.now() }));
            }
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setProducts(data);
          try { sessionStorage.setItem(SHOP_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() })); } catch {}
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-brandRed/20 border-t-brandRed animate-spin" />
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div
      className="relative w-full max-w-7xl mx-auto px-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 z-20 flex justify-between pointer-events-none px-1 sm:px-6">
        <button
          onClick={() => scroll("left")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-900 hover:border-brandRed hover:bg-zinc-900 text-white flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-all shadow-xl disabled:opacity-30 cursor-pointer"
          disabled={activeIndex === 0}
          aria-label="Previous"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => scroll("right")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-950/80 border border-zinc-900 hover:border-brandRed hover:bg-zinc-900 text-white flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-all shadow-xl disabled:opacity-30 cursor-pointer"
          disabled={activeIndex >= Math.max(0, products.length - 2)}
          aria-label="Next"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto gap-4 sm:gap-6 scroll-smooth pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="flex justify-center gap-1.5 sm:gap-2 mt-4">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ left: index * scrollRef.current.clientWidth * 0.7, behavior: "smooth" });
              }
            }}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 cursor-pointer ${
              activeIndex === index ? "bg-brandRed w-4 sm:w-6" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
            aria-label={`Go to item ${index + 1}`}
          />
        ))}
      </div>

      {products.length > 0 && (
        <div className="flex justify-center mt-4">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 border border-zinc-800 hover:border-brandRed bg-zinc-950/80 hover:bg-zinc-900/50 backdrop-blur-sm text-white px-6 sm:px-8 py-3 rounded-full text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 group"
          >
            VISIT OUR SHOP
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default ShopCarousel;
