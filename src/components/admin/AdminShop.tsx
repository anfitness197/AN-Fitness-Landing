"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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

interface ShopTask {
  id: string;
  file: File;
  preview: string;
  title: string;
  status: "compressing" | "idle" | "uploading" | "success" | "error";
  errorMsg?: string;
}

interface AdminShopProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminShop({ addToast }: AdminShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tasks, setTasks] = useState<ShopTask[]>([]);

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

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) return;

    const newTasks: ShopTask[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        addToast(`${file.name}: Please choose an image file.`, "error");
        continue;
      }
      const id = `shop-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`;
      newTasks.push({
        id,
        file,
        preview: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        status: "compressing",
      });
    }
    if (newTasks.length === 0) return;
    setTasks((prev) => [...prev, ...newTasks]);

    for (const task of newTasks) {
      try {
        const compressed = await compressImage(task.file);
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, file: compressed, preview: URL.createObjectURL(compressed), status: "idle" as const } : t)));
      } catch {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "error" as const, errorMsg: "Compress failed" } : t)));
      }
    }
  };

  const removeTask = (id: string) => {
    setTasks((prev) => {
      const t = prev.find((x) => x.id === id);
      if (t?.preview.startsWith("blob:")) URL.revokeObjectURL(t.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleUploadAll = async () => {
    const pending = tasks.filter((t) => t.status === "idle");
    if (pending.length === 0) {
      addToast("No ready items to upload.", "error");
      return;
    }
    setIsUploading(true);
    let successCount = 0;
    const uploaded: Product[] = [];

    const CONCURRENCY = 3;
    for (let i = 0; i < pending.length; i += CONCURRENCY) {
      const batch = pending.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (task) => {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "uploading" as const } : t)));
        try {
          const fd = new FormData();
          fd.append("file", task.file);
          fd.append("folder", "an_fitness/products");
          const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

          const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const saveRes = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: productId, name: task.title.trim(), image: uploadData.url }),
          });
          const saveData = await saveRes.json();
          if (!saveRes.ok) throw new Error(saveData.error || "Save failed");

          uploaded.push({ id: productId, name: task.title.trim(), image: uploadData.url });
          successCount++;
          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "success" as const } : t)));
        } catch (err) {
          setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "error" as const, errorMsg: err instanceof Error ? err.message : "Upload failed" } : t)));
        }
      }));
    }

    setIsUploading(false);
    if (successCount > 0) {
      setProducts((prev) => [...uploaded, ...prev]);
      addToast(`Added ${successCount} product(s) to shop!`, "success");
      try {
        sessionStorage.removeItem("an_products_cache");
        sessionStorage.removeItem("an_shop_carousel_cache");
      } catch {}
      fetchProducts();
    }
    setTimeout(() => {
      setTasks((prev) => {
        prev.filter((t) => t.status === "success").forEach((t) => { if (t.preview.startsWith("blob:")) URL.revokeObjectURL(t.preview); });
        return prev.filter((t) => t.status !== "success");
      });
    }, 2000);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name || product.id}" from the shop?`)) return;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(product.id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      addToast(`"${product.name || "Product"}" deleted.`, "success");
      try {
        sessionStorage.removeItem("an_products_cache");
        sessionStorage.removeItem("an_shop_carousel_cache");
      } catch {}
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete product", "error");
      fetchProducts();
    }
  };

  const idleCount = tasks.filter((t) => t.status === "idle").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="border border-dashed border-zinc-800 rounded-3xl p-6 bg-zinc-900/10">
        <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 pl-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brandRed" />
          Add Products — select multiple images at once
        </h3>

        <div className="relative border border-dashed border-zinc-800 hover:border-brandRed/40 bg-zinc-950/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center group transition-all min-h-[120px] cursor-pointer">
          <Upload size={28} className="text-zinc-600 group-hover:text-brandRed transition-colors mb-2" />
          <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Choose Product Images</span>
          <span className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">PNG, JPG, WEBP — multiple allowed</span>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" disabled={isUploading} />
        </div>

        {tasks.length > 0 && (
          <div className="flex flex-col gap-4 mt-6">
            <h4 className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">Queue ({tasks.length})</h4>
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
              {tasks.map((task) => (
                <div key={task.id} className={`flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/80 border ${task.status === "error" ? "border-brandRed/30" : task.status === "success" ? "border-emerald-500/30" : "border-zinc-900"}`}>
                  <div className="flex gap-4 items-center">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800">
                      <Image src={task.preview} alt="" fill unoptimized className="w-full h-full object-cover" />
                      {(task.status === "compressing" || task.status === "uploading") && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 size={14} className="animate-spin text-brandRed" /></div>}
                    </div>
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <input type="text" value={task.title} onChange={(e) => setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title: e.target.value } : t)))} placeholder="Product title (optional)" className="bg-zinc-950 border border-zinc-900 focus:border-brandRed text-xs text-white rounded-lg px-2.5 py-1.5 outline-none flex-1 truncate" disabled={isUploading || task.status === "success"} />
                        <button onClick={() => removeTask(task.id)} className="p-1.5 rounded-lg bg-zinc-900 hover:bg-brandRed hover:text-white text-zinc-500 transition-colors shrink-0" disabled={isUploading}><X size={12} /></button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-mono uppercase font-black ${task.status === "error" ? "text-brandRed" : task.status === "success" ? "text-emerald-500" : task.status === "uploading" || task.status === "compressing" ? "text-brandRed animate-pulse" : "text-zinc-500"}`}>
                          {task.status === "compressing" || task.status === "uploading" ? "Processing..." : task.status === "idle" ? "Ready" : task.status === "success" ? "Uploaded" : task.errorMsg || "Error"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleUploadAll} disabled={isUploading || idleCount === 0} className="w-full sm:w-auto self-end flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black tracking-widest text-xs uppercase px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer mt-2">
              {isUploading ? <><Loader2 size={14} className="animate-spin" />UPLOADING...</> : <><ShoppingBag size={14} />UPLOAD ALL ({idleCount})</>}
            </button>
          </div>
        )}
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
                <Image
                  src={optimizeMediaUrl(product.image, 400)}
                  alt={product.name}
                  fill
                  unoptimized
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95"
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
                  {product.name || "Untitled"}
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
