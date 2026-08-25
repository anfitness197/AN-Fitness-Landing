"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { optimizeMediaUrl } from "@/lib/cloudinary";
import { EmptyState } from "@/components/empty-state";
import { WHATSAPP_NUMBER } from "@/lib/contact";

interface Product { id: string; name: string | null; image: string; }

const ProductImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const optimized = optimizeMediaUrl(src, 600);
  useEffect(() => { setLoaded(false); setError(false); }, [optimized]);
  useEffect(() => { const img = imgRef.current; if (img?.complete && img.naturalWidth > 0) setLoaded(true); }, [optimized]);
  return (
    <div className="relative w-full h-full bg-zinc-900 overflow-hidden">
      {!loaded && !error && <div className="absolute inset-0 bg-zinc-900 animate-shimmer" />}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Image unavailable</span>
        </div>
      ) : (
        <Image ref={imgRef} src={optimized} alt={alt} fill unoptimized decoding="async" referrerPolicy="no-referrer" className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`} onLoad={() => setLoaded(true)} onError={() => setError(true)} />
      )}
    </div>
  );
};

export default function ShopGrid({ products }: { products: Product[] }) {
  const handleEnquire = useCallback((product: Product) => {
    const label = product.name?.trim() ? `"${product.name.trim()}"` : "this product";
    const lines = [`Hi AN Fitness, I want to buy ${label}. Please send me the details.`];
    if (product.name?.trim()) lines.push(`\nProduct: ${product.name.trim()}`);
    if (product.image) lines.push(`Product image: ${product.image}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  }, []);

  if (!products.length) {
    return <EmptyState title="No products available yet" description="Check back soon for new items in our shop." />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {products.map((product) => (
        <div key={product.id} className="group flex flex-col rounded-2xl overflow-hidden bg-zinc-900/30 border border-zinc-900/80 hover:border-brandRed/40 transition-all duration-300">
          <div className="relative aspect-square overflow-hidden bg-zinc-900">
            <ProductImage src={product.image} alt={product.name || "AN Fitness Product"} />
          </div>
          <div className="p-3 sm:p-4 flex flex-col gap-3">
            <h3 className="font-heading font-black text-xs sm:text-sm text-white uppercase tracking-wider leading-tight line-clamp-2">
              {product.name?.trim() || "AN Fitness Product"}
            </h3>
            <button onClick={() => handleEnquire(product)} className="w-full flex items-center justify-center gap-2 border border-brandRed bg-brandRed/10 hover:bg-brandRed text-white px-3 py-2.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer">
              <ShoppingBag size={12} /> Enquire Now
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
