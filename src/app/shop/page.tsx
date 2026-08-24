"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { optimizeMediaUrl } from "@/lib/cloudinary";
import { BackLink } from "@/components/back-link";
import { PageLoading } from "@/components/page-loading";
import { EmptyState } from "@/components/empty-state";
import { LoadError } from "@/components/load-error";
import { WHATSAPP_NUMBER } from "@/lib/contact";

interface Product {
  id: string;
  name: string;
  image: string;
}

const PRODUCTS_CACHE_KEY = "an_products_cache";
const PRODUCTS_CACHE_TTL = 2 * 60 * 1000;

const ProductImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const optimized = optimizeMediaUrl(src, 600);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [optimized]);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [optimized]);

  return (
    <div className="relative w-full h-full bg-zinc-900 overflow-hidden">
      {!loaded && !error && (
        <div className="absolute inset-0 bg-zinc-900 animate-shimmer" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Image unavailable</span>
        </div>
      ) : (
        <Image
          ref={imgRef}
          src={optimized}
          alt={alt}
          fill
          unoptimized
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setLoadError(false);

      try {
        const cached = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < PRODUCTS_CACHE_TTL && Array.isArray(parsed.data)) {
            if (!cancelled) {
              setProducts(parsed.data);
              setLoading(false);
            }

            const res = await fetch("/api/products", { cache: "no-store" });
            const freshData = await res.json();
            if (cancelled) return;
            if (res.ok && Array.isArray(freshData)) {
              setProducts(freshData);
              try {
                sessionStorage.setItem(
                  PRODUCTS_CACHE_KEY,
                  JSON.stringify({ data: freshData, timestamp: Date.now() })
                );
              } catch {}
            }
            return;
          }
        }
      } catch {}

      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data)) {
          setProducts(data);
          try {
            sessionStorage.setItem(
              PRODUCTS_CACHE_KEY,
              JSON.stringify({ data, timestamp: Date.now() })
            );
          } catch {}
        } else {
          setProducts([]);
          setLoadError(true);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const handleEnquire = useCallback((product: Product) => {
    const productLabel = product.name?.trim() ? `"${product.name.trim()}"` : "this product";
    const imageUrl = product.image || "";
    const messageLines = [
      `Hi AN Fitness, I want to buy ${productLabel}. Please send me the details.`,
    ];
    if (product.name?.trim()) messageLines.push(`\nProduct: ${product.name.trim()}`);
    if (imageUrl) messageLines.push(`Product image: ${imageUrl}`);
    const message = messageLines.join("\n");

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between overflow-x-hidden text-white pt-20 sm:pt-24 pb-12 sm:pb-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] bg-brandRed/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col gap-6 sm:gap-10">
        <div className="self-start">
          <BackLink />
        </div>

        <div className="text-left flex flex-col gap-2 sm:gap-3">
          <span className="text-[11px] sm:text-xs text-brandRed font-mono font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] bg-brandRed/10 px-3 py-1 rounded self-start">
            Premium Supplements
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-6xl text-white uppercase tracking-tight leading-none">
            Shop
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm md:text-base max-w-xl font-light">
            Premium supplements from top brands. Tap &quot;Enquire Now&quot; on any product to get details on WhatsApp.
          </p>
        </div>

        {loading ? (
          <PageLoading label="Loading products..." />
        ) : loadError ? (
          <LoadError
            message="We couldn't load the shop. Please try again."
            onRetry={() => setRetryKey((k) => k + 1)}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products available yet"
            description="Check back soon for new items in our shop."
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="group flex flex-col rounded-2xl overflow-hidden bg-zinc-900/30 border border-zinc-900/80 hover:border-brandRed/40 transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden bg-zinc-900">
                  <ProductImage src={product.image} alt={product.name} />
                </div>

                <div className="p-3 sm:p-4 flex flex-col gap-3">
                  <h3 className="font-heading font-black text-xs sm:text-sm text-white uppercase tracking-wider leading-tight line-clamp-2">
                    {product.name?.trim() || "AN Fitness Product"}
                  </h3>

                  <button
                    onClick={() => handleEnquire(product)}
                    className="w-full flex items-center justify-center gap-2 border border-brandRed bg-brandRed/10 hover:bg-brandRed text-white px-3 py-2.5 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all duration-300 cursor-pointer"
                  >
                    <ShoppingBag size={12} />
                    Enquire Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
