"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Upload, Loader2, Play, X } from "lucide-react";
import { getMediaThumbnail, isVideoUrl } from "@/lib/cloudinary";
import { compressImageToWebp as compressImage, VIDEO_MAX_UPLOAD_BYTES } from "@/lib/media-convert";

interface GalleryItem {
  id: string;
  url: string;
  category: string;
  title: string;
  type?: "image" | "video";
}

interface UploadTask {
  id: string;
  file: File;
  preview: string;
  title: string;
  category: string;
  status: "idle" | "compressing" | "uploading" | "success" | "error";
  errorMsg?: string;
  originalSize?: number;
  compressedSize?: number;
}

interface AdminGalleryProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminGallery({ addToast }: AdminGalleryProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryFilter, setGalleryFilter] = useState("all");
  const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);

  const fetchGallery = useCallback(async () => {
    setIsLoadingGallery(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json();
      if (res.ok) setGallery(data);
      else throw new Error(data.error);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load gallery", "error");
    } finally {
      setIsLoadingGallery(false);
    }
  }, [addToast]);

  useEffect(() => { fetchGallery(); }, [fetchGallery]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newTasks: UploadTask[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const id = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`;
      const preview = URL.createObjectURL(file);
      newTasks.push({ id, file, preview, title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "), category: "strength", status: "compressing", originalSize: file.size });
    }
    setUploadTasks((prev) => [...prev, ...newTasks]);
    for (const task of newTasks) {
      await new Promise((r) => setTimeout(r, 80));
      try {
        const isVideo = task.file.type.startsWith("video/");
        setUploadTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "compressing" } : t)));
        
        const prepared = isVideo ? task.file : await compressImage(task.file);
        const maxBytes = isVideo ? VIDEO_MAX_UPLOAD_BYTES : 2 * 1024 * 1024;
        if (prepared.size > maxBytes) {
          setUploadTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "error", errorMsg: "Too large", compressedSize: prepared.size } : t));
          addToast("File too large. Try another one.", "error");
        } else {
          setUploadTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, file: prepared, preview: URL.createObjectURL(prepared), status: "idle", compressedSize: prepared.size } : t));
        }
      } catch {
        setUploadTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: "error", errorMsg: "Processing failed" } : t));
        addToast("Processing failed.", "error");
      }
    }
  };

  const handleRemoveTask = (id: string) => {
    setUploadTasks((prev) => {
      const task = prev.find((t) => t.id === id);
      if (task?.preview.startsWith("blob:")) URL.revokeObjectURL(task.preview);
      return prev.filter((t) => t.id !== id);
    });
  };

  const handleUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    const pending = uploadTasks.filter((t) => t.status === "idle");
    if (pending.length === 0) { addToast("No ready files.", "error"); return; }
    setIsUploading(true);
    let successCount = 0;
    for (const task of pending) {
      setUploadTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "uploading" } : t)));
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", task.file);
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: uploadFormData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
        const fileId = uploadData.key.replace("gallery-", "").split(".")[0];
        const saveRes = await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: fileId, url: uploadData.url, category: task.category, title: task.title || "Untitled", type: uploadData.type || (task.file.type.startsWith("video/") ? "video" : "image") }) });
        if (!saveRes.ok) throw new Error();
        successCount++;
        setUploadTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "success" } : t)));
      } catch {
        setUploadTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "error", errorMsg: "Upload failed" } : t)));
        addToast("Upload failed.", "error");
      }
    }
    setIsUploading(false);
    if (successCount > 0) { addToast(`Uploaded ${successCount} file(s)!`); fetchGallery(); }
    setTimeout(() => { setUploadTasks((prev) => { prev.filter((t) => t.status === "success").forEach((t) => URL.revokeObjectURL(t.preview)); return prev.filter((t) => t.status !== "success"); }); }, 2000);
  };

  const handleDeleteGallery = async (id: string) => {
    if (!confirm("Delete this media item?")) return;
    try {
      let res = await fetch(`/api/gallery?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) res = await fetch(`/api/gallery/${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast("Deleted.");
      fetchGallery();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
        <div className="flex flex-col gap-4">
          <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">Select Image & Video Files</label>
          <div className="relative border border-dashed border-zinc-800 hover:border-brandRed/40 bg-zinc-950/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center group transition-all min-h-[120px] cursor-pointer">
            <Upload size={28} className="text-zinc-600 group-hover:text-brandRed transition-colors mb-2" />
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Choose Media Files</span>
            <span className="text-[10px] text-zinc-600 mt-1 uppercase font-mono">PNG, JPG, WEBP, MP4, WEBM</span>
            <input type="file" accept="image/*,video/*" multiple onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" disabled={isUploading} />
          </div>
        </div>
        {uploadTasks.length > 0 && (
          <div className="flex flex-col gap-4 mt-6">
            <h4 className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">Queue ({uploadTasks.length})</h4>
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-none">
              {uploadTasks.map((task) => (
                <div key={task.id} className={`flex flex-col gap-3 p-4 rounded-2xl bg-zinc-950/80 border ${task.status === "error" ? "border-brandRed/30" : task.status === "success" ? "border-emerald-500/30" : "border-zinc-900"}`}>
                  <div className="flex gap-4 items-center">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800 flex items-center justify-center">
                      {task.file.type.startsWith("video/") ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center">
                          <video src={task.preview} className="w-full h-full object-cover" muted preload="metadata" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><Play size={14} className="text-white fill-white ml-0.5" /></div>
                        </div>
                      ) : <img src={task.preview} alt="" className="w-full h-full object-cover" />}
                      {(task.status === "compressing" || task.status === "uploading") && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><Loader2 size={12} className="animate-spin text-brandRed" /></div>}
                    </div>
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <input type="text" value={task.title} onChange={(e) => setUploadTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title: e.target.value } : t)))} placeholder="Title" className="bg-zinc-950 border border-zinc-900 focus:border-brandRed text-xs text-white rounded-lg px-2.5 py-1.5 outline-none flex-1 truncate" disabled={isUploading || task.status === "success"} />
                        <button onClick={() => handleRemoveTask(task.id)} className="p-1.5 rounded-lg bg-zinc-900 hover:bg-brandRed hover:text-white text-zinc-500 transition-colors shrink-0" disabled={isUploading}><X size={12} /></button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <select value={task.category} onChange={(e) => setUploadTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, category: e.target.value } : t)))} className="bg-zinc-950 border border-zinc-900 text-[10px] text-zinc-400 rounded-lg px-2 py-1 outline-none cursor-pointer" disabled={isUploading || task.status === "success"}>
                          <option value="strength">STRENGTH FLOOR</option><option value="combat">COMBAT ZONE</option><option value="recovery">RECOVERY SPA</option><option value="facility">FACILITY ROOMS</option>
                        </select>
                        <span className={`text-[9px] font-mono uppercase font-black ${task.status === "error" ? "text-brandRed" : task.status === "success" ? "text-emerald-500" : task.status === "uploading" || task.status === "compressing" ? "text-brandRed animate-pulse" : "text-zinc-500"}`}>
                          {task.status === "compressing" || task.status === "uploading" ? "Processing..." : task.status === "idle" ? "Ready" : task.status === "success" ? "Uploaded" : "Error"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleUploadGallery} disabled={isUploading || uploadTasks.filter(t => t.status === "idle").length === 0} className="w-full sm:w-auto self-end flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 disabled:text-zinc-600 text-white font-black tracking-widest text-xs uppercase px-8 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer mt-4">
              {isUploading ? <><Loader2 size={14} className="animate-spin" />UPLOADING...</> : <>UPLOAD ALL ({uploadTasks.filter(t => t.status === "idle").length})</>}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-2">
          {[{ id: "all", label: "ALL MEDIA" }, { id: "video", label: "🎥 VIDEOS" }, { id: "image", label: "📷 PHOTOS" }, { id: "strength", label: "STRENGTH" }, { id: "facility", label: "FACILITY" }].map((f) => (
            <button key={f.id} onClick={() => setGalleryFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${galleryFilter === f.id ? "bg-brandRed text-white shadow-md" : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {isLoadingGallery ? (
        <div className="py-20 flex justify-center items-center"><Loader2 size={32} className="animate-spin text-brandRed" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {gallery.filter((photo) => {
            const isVid = isVideoUrl(photo.url, photo.type);
            if (galleryFilter === "all") return true;
            if (galleryFilter === "video") return isVid;
            if (galleryFilter === "image") return !isVid;
            return (photo.category || "").toLowerCase() === galleryFilter.toLowerCase();
          }).map((photo) => {
            const isVideo = isVideoUrl(photo.url, photo.type);
            const thumbnailUrl = getMediaThumbnail(photo.url, photo.type);
            return (
              <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-900 hover:border-zinc-800 shadow-lg transition-all">
                {isVideo ? (
                  <div className="w-full h-full relative bg-black">
                    <img src={thumbnailUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90" loading="lazy" decoding="async" />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-brandRed/90 flex items-center justify-center text-white"><Play size={14} className="fill-white ml-0.5" /></div></div>
                    <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-brandRed text-[8px] font-mono font-bold px-2 py-0.5 rounded">VIDEO</div>
                  </div>
                ) : (
                  <img src={photo.url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-95" loading="lazy" decoding="async" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-between items-start">
                  <span className="text-[8px] font-mono tracking-widest text-brandRed bg-brandRed/10 border border-brandRed/20 px-2 py-0.5 rounded uppercase">{photo.category}</span>
                  <div className="w-full flex justify-between items-center gap-2">
                    <p className="text-[10px] font-bold text-white uppercase truncate">{photo.title}</p>
                    <button onClick={() => handleDeleteGallery(photo.id)} className="p-1.5 rounded-lg bg-zinc-950 hover:bg-brandRed text-zinc-500 hover:text-white transition-colors cursor-pointer"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
          {gallery.length === 0 && <div className="col-span-full py-16 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">Gallery is empty.</div>}
        </div>
      )}
    </div>
  );
}
