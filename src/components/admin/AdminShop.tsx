"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Trash2, Upload, Loader2, ShoppingBag, X,
} from "lucide-react";
import { compressImageToWebp as compressImage } from "@/lib/media-convert";
import { optimizeMediaUrl } from "@/lib/cloudinary";

interface Product {
  id: string;
  name: string;
  image: string;
}

interface AdminShopProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminShop({ addToast }: AdminShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  
  const [productName, setProductName] = useState("");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setProducts(data);
      else throw new Error(data.error || "Failed to load products");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load products", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addToast("Please choose an image file.", "error");
      return;
    }

    setProductImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setProductName("");
    setProductImage(null);
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview("");
    setIsCompressing(false);
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (!productImage) {
      addToast("Please select a product image.", "error");
      return;
    }

    setIsSaving(true);

    try {
      
      setIsCompressing(true);
      let file = productImage;
      try {
        file = await compressImage(productImage);
      } catch {
        
      }
      setIsCompressing(false);

      
      setIsUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "an_fitness/products");

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
      setIsUploading(false);

      
      const productId = `prod-${Date.now()}`;
      const saveRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          name: productName.trim(),
          image: uploadData.url,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error || "Save failed");

      addToast(`"${productName}" added to shop!`, "success");
      resetForm();
      fetchProducts();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save product", "error");
    } finally {
      setIsSaving(false);
      setIsCompressing(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}" from the shop?`)) return;
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      addToast(`"${product.name}" deleted.`, "success");
      fetchProducts();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete product", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8">

      <div className="border border-dashed border-zinc-800 rounded-3xl p-6 bg-zinc-900/10">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 pl-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brandRed" />
          {productImage || productName ? "Creating New Product" : "Add New Product"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          <div className="relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Product preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-600">
                <Upload size={32} />
                <span className="text-xs font-mono uppercase tracking-widest">Product Image</span>
              </div>
            )}

            {(isCompressing || isUploading) && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-brandRed" />
                  <span className="text-xs font-mono text-white uppercase tracking-widest">
                    {isCompressing ? "Compressing..." : "Uploading..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                Product Image
              </label>
              <label className="flex items-center justify-center gap-2 w-full border border-dashed border-zinc-700 hover:border-brandRed bg-zinc-950/50 text-zinc-300 hover:text-white px-4 py-4 rounded-xl text-xs font-bold tracking-wide cursor-pointer transition-all">
                <Upload size={14} />
                {productImage ? productImage.name : "Choose image file"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImagePick}
                  disabled={isSaving}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                Product Title <span className="text-zinc-600">(optional)</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. AN Fitness Premium T-Shirt"
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3.5 rounded-xl text-sm placeholder-zinc-700 outline-none transition-all duration-300"
                disabled={isSaving}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                  disabled={isSaving || !productImage}
                className="flex-1 flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 disabled:text-zinc-600 text-white font-black tracking-widest text-xs uppercase py-3.5 rounded-xl shadow-lg shadow-brandRed/20 transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    SAVING...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={14} />
                    ADD TO SHOP
                  </>
                )}
              </button>

              {(productImage || productName.trim()) && (
                <button
                  onClick={resetForm}
                  disabled={isSaving}
                  className="px-4 flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase py-3.5 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 size={32} className="animate-spin text-brandRed" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900/30 border border-zinc-900/80 hover:border-zinc-800 transition-all duration-300"
            >
              <div className="relative aspect-square overflow-hidden bg-zinc-900">
                <img
                  src={optimizeMediaUrl(product.image, 400)}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
                  loading="lazy"
                  decoding="async"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end items-start">
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 hover:bg-brandRed hover:border-brandRed text-zinc-500 hover:text-white transition-colors cursor-pointer self-end"
                    title="Delete Product"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-3">
                <h4 className="font-heading font-black text-[10px] text-white uppercase tracking-wider leading-tight line-clamp-2">
                  {product.name}
                </h4>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="col-span-full py-16 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">
              No products added yet. Add your first product above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
