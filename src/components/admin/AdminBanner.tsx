"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Save, Trash2, Upload, Loader2, Video, Music } from "lucide-react";
import { formatBytes, VIDEO_MAX_UPLOAD_BYTES } from "@/lib/media-convert";
import { getVideoPlaybackUrl } from "@/lib/cloudinary";

interface AdminBannerProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminBanner({ addToast }: AdminBannerProps) {
  const [mediaBannerUrl, setMediaBannerUrl] = useState("");
  const [mediaBannerType, setMediaBannerType] = useState<"video" | "audio">("video");
  const [mediaBannerActive, setMediaBannerActive] = useState(false);
  const [mediaBannerExpiresAt, setMediaBannerExpiresAt] = useState("");
  const [mediaBannerWidth, setMediaBannerWidth] = useState<number | undefined>();
  const [mediaBannerHeight, setMediaBannerHeight] = useState<number | undefined>();
  const [isLoadingMediaBanner, setIsLoadingMediaBanner] = useState(false);
  const [isSavingMediaBanner, setIsSavingMediaBanner] = useState(false);
  const [isUploadingMediaBanner, setIsUploadingMediaBanner] = useState(false);
  const [mediaBannerUploadLabel, setMediaBannerUploadLabel] = useState("");

  const fetchMediaBanner = useCallback(async () => {
    setIsLoadingMediaBanner(true);
    try {
      const res = await fetch("/api/media-banner?admin=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMediaBannerUrl(data.mediaUrl || "");
      setMediaBannerType(data.mediaType === "audio" ? "audio" : "video");
      setMediaBannerActive(data.active === 1);
      setMediaBannerWidth(typeof data.width === "number" ? data.width : undefined);
      setMediaBannerHeight(typeof data.height === "number" ? data.height : undefined);
      if (data.expiresAt) {
        const d = new Date(data.expiresAt);
        if (!Number.isNaN(d.getTime())) {
          setMediaBannerExpiresAt(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
        } else setMediaBannerExpiresAt("");
      } else setMediaBannerExpiresAt("");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load", "error");
    }
    finally { setIsLoadingMediaBanner(false); }
  }, [addToast]);

  useEffect(() => { fetchMediaBanner(); }, [fetchMediaBanner]);

  const handleMediaBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(file.name);
    if (!isVideo && !isAudio) { addToast("Please choose a video or audio file.", "error"); return; }
    setIsUploadingMediaBanner(true);
    try {
      let uploadFile = file;
      if (isVideo) {
        if (file.size > VIDEO_MAX_UPLOAD_BYTES) {
          addToast(`Video is ${formatBytes(file.size)}. Max is ${formatBytes(VIDEO_MAX_UPLOAD_BYTES)}.`, "error");
          return;
        }
      }
      setMediaBannerUploadLabel("Uploading...");
      const formData = new FormData(); formData.append("file", uploadFile); formData.append("folder", "an_fitness/media-banner");
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setMediaBannerUrl(data.url);
      setMediaBannerType(data.type === "audio" || isAudio ? "audio" : "video");
      if (typeof data.width === "number") setMediaBannerWidth(data.width);
      if (typeof data.height === "number") setMediaBannerHeight(data.height);
      addToast("Uploaded. Turn on and Save to show on homepage.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Upload failed.", "error");
    }
    finally { setIsUploadingMediaBanner(false); setMediaBannerUploadLabel(""); }
  };

  const handleSaveMediaBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaBannerActive && !mediaBannerUrl) { addToast("Add a file first.", "error"); return; }
    setIsSavingMediaBanner(true);
    try {
      const res = await fetch("/api/media-banner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaUrl: mediaBannerUrl, mediaType: mediaBannerType, active: mediaBannerActive, expiresAt: mediaBannerExpiresAt ? new Date(mediaBannerExpiresAt).toISOString() : null, width: mediaBannerWidth, height: mediaBannerHeight }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(mediaBannerActive ? "Saved — now live on homepage." : "Saved (hidden).", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Couldn't save.", "error");
    }
    finally { setIsSavingMediaBanner(false); }
  };

  const handleClearMediaBanner = async () => {
    if (!confirm("Remove this promo?")) return;
    setIsSavingMediaBanner(true);
    try {
      const res = await fetch("/api/media-banner", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMediaBannerUrl(""); setMediaBannerActive(false); setMediaBannerExpiresAt(""); setMediaBannerWidth(undefined); setMediaBannerHeight(undefined);
      addToast("Promo removed.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Couldn't remove.", "error");
    }
    finally { setIsSavingMediaBanner(false); }
  };

  return (
    <div className="max-w-xl bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
      <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight mb-1 flex items-center gap-3"><Video className="text-brandRed" size={20} />Home Promo</h3>
      <p className="text-zinc-500 text-xs mb-6">Show a banner video or audio when someone opens the homepage</p>
      {isLoadingMediaBanner ? (
        <div className="flex items-center gap-2 text-zinc-500 text-xs py-8 justify-center"><Loader2 size={16} className="animate-spin text-brandRed" />Loading...</div>
      ) : (
        <form onSubmit={handleSaveMediaBanner} className="flex flex-col gap-5">
          {mediaBannerUrl ? (
            <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
              {mediaBannerType === "audio" ? (
                <div className="flex flex-col items-center gap-3 p-6 w-full"><Music className="text-brandRed" size={28} /><audio src={mediaBannerUrl} controls className="w-full max-w-md" preload="metadata" /></div>
              ) : (
                <video src={getVideoPlaybackUrl(mediaBannerUrl)} controls playsInline preload="metadata" className="max-w-full max-h-full object-contain" />
              )}
            </div>
          ) : null}
          <label className="flex items-center justify-center gap-2 w-full border border-dashed border-zinc-700 hover:border-brandRed bg-zinc-950/50 text-zinc-300 hover:text-white px-4 py-4 rounded-xl text-xs font-bold tracking-wide cursor-pointer transition-all">
            {isUploadingMediaBanner ? <><Loader2 size={14} className="animate-spin" />{mediaBannerUploadLabel || "Working..."}</> : <><Upload size={14} />{mediaBannerUrl ? "Replace file" : "Add video or audio"}</>}
            <input type="file" accept="video/*,audio/*,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm,.mov" className="sr-only" disabled={isUploadingMediaBanner || isSavingMediaBanner} onChange={handleMediaBannerUpload} />
          </label>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">End date (optional)</label>
            <div className="flex gap-2">
              <input type="datetime-local" value={mediaBannerExpiresAt} onChange={(e) => setMediaBannerExpiresAt(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3 rounded-xl text-xs outline-none" disabled={isSavingMediaBanner} />
              {mediaBannerExpiresAt && <button type="button" onClick={() => setMediaBannerExpiresAt("")} className="text-xs text-zinc-400 hover:text-white px-3 border border-zinc-800 rounded-xl cursor-pointer">Clear</button>}
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={mediaBannerActive} onChange={(e) => setMediaBannerActive(e.target.checked)} className="sr-only" disabled={isSavingMediaBanner} />
            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${mediaBannerActive ? "bg-brandRed border-brandRed" : "border-zinc-700 bg-zinc-950"}`}>
              {mediaBannerActive && <svg className="w-2.5 h-2.5 text-white fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
            </div>
            <span className="text-xs font-bold text-zinc-300">Show on homepage</span>
          </label>
          <div className="flex gap-2 pt-1">
            {mediaBannerUrl && <button type="button" onClick={handleClearMediaBanner} disabled={isSavingMediaBanner} className="flex items-center justify-center gap-2 border border-zinc-800 hover:border-brandRed text-zinc-400 hover:text-white font-bold text-xs px-4 py-3 rounded-xl cursor-pointer"><Trash2 size={14} />Remove</button>}
            <button type="submit" disabled={isSavingMediaBanner || isUploadingMediaBanner} className="flex-1 flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 text-white font-black tracking-widest text-xs uppercase px-6 py-3 rounded-xl cursor-pointer">{isSavingMediaBanner ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save</>}</button>
          </div>
        </form>
      )}
    </div>
  );
}
