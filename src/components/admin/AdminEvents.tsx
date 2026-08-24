"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus, Save, Trash2, Edit2, X, Upload, Loader2, Calendar,
  Megaphone, Bell, Send, FileText,
} from "lucide-react";
import { compressImageToWebp as compressImage } from "@/lib/media-convert";

interface GymEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  posterUrl: string;
  category: string;
  type?: "event" | "notification";
  sendPush?: boolean;
}

interface AdminEventsProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminEvents({ addToast }: AdminEventsProps) {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState<GymEvent | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [adminEventsFilter, setAdminEventsFilter] = useState<"all" | "event" | "notification">("all");
  const [showQuickPushForm, setShowQuickPushForm] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [pushTitle, setPushTitle] = useState("");
  const [pushMessage, setPushMessage] = useState("");
  const [pushImage, setPushImage] = useState("");
  const [pushUrl, setPushUrl] = useState("/events");
  const [pushType, setPushType] = useState<"event" | "notification">("notification");
  const [pushStatus, setPushStatus] = useState<{ subscriberCount: number } | null>(null);

  const fetchPushStatus = async () => {
    try {
      const res = await fetch("/api/push/send");
      const data = await res.json();
      if (res.ok) setPushStatus(data);
    } catch {}
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setEvents(data);
      else setEvents([]);
    } catch {} finally { setIsLoadingEvents(false); }
  };

  useEffect(() => { fetchEvents(); fetchPushStatus(); }, []);

  const handleSaveEvent = async (eventData: GymEvent, isNew = false) => {
    if (!eventData.title?.trim() || !eventData.description?.trim()) {
      addToast("Title and description are required.", "error"); return;
    }
    try {
      const endpoint = isNew ? "/api/events" : `/api/events/${eventData.id}`;
      const res = await fetch(endpoint, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...eventData, title: eventData.title.trim(), description: eventData.description.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(`"${eventData.title}" saved!`);
      setEditingEventId(null); setNewEvent(null); fetchEvents();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save", "error");
    }
  };

  const handleDeleteEvent = async (id: string, title?: string, type?: string) => {
    const label = type === "notification" ? "notification" : "event";
    if (!confirm(`Delete this ${label}${title ? `: "${title}"` : ""}?`)) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast("Deleted!");
      fetchEvents();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
  };

  const handlePosterFileUpload = async (file: File, updateUrl: (url: string) => void) => {
    setIsUploadingPoster(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData(); formData.append("file", compressed);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      updateUrl(data.url);
      addToast("Poster uploaded!");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Upload failed", "error");
    }
    finally { setIsUploadingPoster(false); }
  };

  const handleSendManualPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim()) { addToast("Title is required.", "error"); return; }
    setIsBroadcasting(true);
    try {
      const res = await fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: pushTitle.trim(), message: pushMessage.trim(), image: pushImage.trim(), url: pushUrl.trim() || "/events", type: pushType }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast(data.message || "Alert sent!");
      setPushTitle(""); setPushMessage(""); setPushImage("");
      fetchPushStatus();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to send", "error");
    }
    finally { setIsBroadcasting(false); }
  };

  const filteredEvents = events.filter(ev => {
    if (adminEventsFilter === "event") return ev.type !== "notification";
    if (adminEventsFilter === "notification") return ev.type === "notification";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6">
        <div>
          <h3 className="font-heading font-black text-xl text-white uppercase tracking-tight flex items-center gap-3"><Calendar className="text-brandRed" size={22} />Events & announcements</h3>
          <p className="text-zinc-500 text-xs mt-1">{pushStatus?.subscriberCount ?? 0} alert subscribers</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button onClick={() => setNewEvent({ id: `event-${Date.now()}`, title: "", description: "", date: "", time: "", location: "AN Fitness, Khordha", posterUrl: "", category: "Special Event", type: "event", sendPush: true })} className="inline-flex items-center gap-2 bg-brandRed hover:bg-brandRed-light text-white font-bold text-xs uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer shadow-lg"><Plus size={16} />Create event</button>
          <button onClick={() => setNewEvent({ id: `notification-${Date.now()}`, title: "", description: "", date: "", time: "", location: "AN Fitness, Khordha", posterUrl: "", category: "Announcement", type: "notification", sendPush: true })} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer"><Megaphone size={16} />Create announcement</button>
          <button onClick={() => setShowQuickPushForm(!showQuickPushForm)} className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs uppercase tracking-widest px-4 py-3 rounded-xl transition-all cursor-pointer"><Bell size={16} className="text-brandRed" />Quick alert</button>
        </div>
      </div>

      {showQuickPushForm && (
        <div className="bg-zinc-900/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <h4 className="font-heading font-black text-base uppercase tracking-wider text-white flex items-center gap-2"><Send size={16} className="text-amber-500" />QUICK ANNOUNCEMENT</h4>
            <button onClick={() => setShowQuickPushForm(false)} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-500 transition-colors"><X size={16} /></button>
          </div>
          <form onSubmit={handleSendManualPush} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">Title *</label><input type="text" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} placeholder="e.g. Gym timings update" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">Category</label><select value={pushType} onChange={(e) => setPushType(e.target.value as "event" | "notification")} className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-3 py-3 rounded-xl text-xs text-white outline-none cursor-pointer"><option value="notification">📢 Announcement</option><option value="event">🏋️ Event</option></select></div>
                <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">Link</label><input type="text" value={pushUrl} onChange={(e) => setPushUrl(e.target.value)} placeholder="/events" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-3 py-3 rounded-xl text-xs text-white outline-none" /></div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">Message <span className="text-zinc-600 normal-case">(optional — defaults to title)</span></label><textarea rows={3} value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} placeholder="Optional — leave empty to use the title as the message" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed p-4 rounded-xl text-xs text-white outline-none resize-none" /></div>
            <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">Poster image (optional)</label><div className="flex gap-2 items-center"><input type="text" value={pushImage} onChange={(e) => setPushImage(e.target.value)} placeholder="Image URL..." className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /><label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl text-xs font-mono font-bold cursor-pointer flex items-center gap-2">{isUploadingPoster ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}UPLOAD<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePosterFileUpload(file, (url) => setPushImage(url)); }} /></label></div></div>
            <button type="submit" disabled={isBroadcasting} className="mt-2 self-end inline-flex items-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all cursor-pointer">{isBroadcasting ? <><Loader2 size={16} className="animate-spin" />Sending...</> : <><Send size={16} />Publish & send</>}</button>
          </form>
        </div>
      )}

      {(newEvent || editingEventId) && (
        <div className="bg-zinc-900/40 border border-brandRed/30 rounded-3xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
            <h4 className="font-heading font-black text-base uppercase tracking-wider text-white">{newEvent ? (newEvent.type === "notification" ? "Create announcement" : "Create event") : "Edit"}</h4>
            <button onClick={() => { setNewEvent(null); setEditingEventId(null); }} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-500"><X size={16} /></button>
          </div>
          {(() => {
            const activeEvent = newEvent || events.find(e => e.id === editingEventId);
            if (!activeEvent) return null;
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">Type</label><select value={activeEvent.type || "event"} onChange={(e) => { const val = e.target.value as "event" | "notification"; if (newEvent) setNewEvent({ ...newEvent, type: val }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, type: val } : ev)); }} className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-3 py-3 rounded-xl text-xs text-white outline-none cursor-pointer"><option value="event">Event</option><option value="notification">Announcement</option></select></div>
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">Send alert</label><label className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-3 rounded-xl cursor-pointer"><input type="checkbox" checked={activeEvent.sendPush ?? true} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, sendPush: e.target.checked }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, sendPush: e.target.checked } : ev)); }} className="w-4 h-4 accent-brandRed cursor-pointer" /><span className="text-[11px] text-zinc-300">Send to phones</span></label></div>
                  </div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">TITLE *</label><input type="text" value={activeEvent.title} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, title: e.target.value }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, title: e.target.value } : ev)); }} placeholder="e.g. ANNUAL POWERLIFTING WORKSHOP" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">CATEGORY</label><input type="text" value={activeEvent.category} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, category: e.target.value }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, category: e.target.value } : ev)); }} placeholder="Zumba / Workshop" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">DATE</label><input type="text" value={activeEvent.date} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, date: e.target.value }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, date: e.target.value } : ev)); }} placeholder="25th Aug 2026" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">TIME</label><input type="text" value={activeEvent.time} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, time: e.target.value }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, time: e.target.value } : ev)); }} placeholder="6:00 AM" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /></div>
                    <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">LOCATION</label><input type="text" value={activeEvent.location} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, location: e.target.value }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, location: e.target.value } : ev)); }} placeholder="AN Fitness, Khordha" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /></div>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">POSTER IMAGE</label><div className="flex gap-2 items-center"><input type="text" value={activeEvent.posterUrl || ""} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, posterUrl: e.target.value }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, posterUrl: e.target.value } : ev)); }} placeholder="Poster URL" className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-brandRed px-4 py-3 rounded-xl text-xs text-white outline-none" /><label className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl text-xs font-mono font-bold cursor-pointer flex items-center gap-2">{isUploadingPoster ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}UPLOAD<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePosterFileUpload(file, (url) => { if (newEvent) setNewEvent({ ...newEvent, posterUrl: url }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, posterUrl: url } : ev)); }); }} /></label></div></div>
                  <div className="flex flex-col gap-1.5 flex-1"><label className="text-[10px] font-mono uppercase font-bold text-zinc-400">DESCRIPTION *</label><textarea rows={4} value={activeEvent.description} onChange={(e) => { if (newEvent) setNewEvent({ ...newEvent, description: e.target.value }); else setEvents(events.map(ev => ev.id === editingEventId ? { ...ev, description: e.target.value } : ev)); }} placeholder="Write details..." className="h-full bg-zinc-950 border border-zinc-800 focus:border-brandRed p-4 rounded-xl text-xs text-white outline-none resize-none" /></div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => { setNewEvent(null); setEditingEventId(null); }} className="px-5 py-3 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase cursor-pointer">CANCEL</button>
                    <button onClick={() => handleSaveEvent(activeEvent, !!newEvent)} className="px-6 py-3 rounded-xl bg-brandRed hover:bg-brandRed-light text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer"><Save size={14} />SAVE & PUBLISH</button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
        {(["all", "event", "notification"] as const).map((f) => (
          <button key={f} onClick={() => setAdminEventsFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${adminEventsFilter === f ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-500 hover:text-white"}`}>
            {f === "all" ? `ALL (${events.length})` : f === "event" ? `EVENTS (${events.filter(e => e.type !== "notification").length})` : `ANNOUNCEMENTS (${events.filter(e => e.type === "notification").length})`}
          </button>
        ))}
      </div>

      <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6">
        {isLoadingEvents ? (
          <div className="py-16 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-brandRed" /></div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-zinc-600 text-xs font-mono uppercase tracking-widest">No items yet.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredEvents.map((ev) => {
              const isNotif = ev.type === "notification";
              return (
                <div key={ev.id} className={`bg-zinc-950 border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center ${isNotif ? "border-amber-500/30 hover:border-amber-500/50" : "border-zinc-800/80 hover:border-zinc-700"}`}>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center flex-1">
                    {ev.posterUrl ? <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-zinc-800"><Image src={ev.posterUrl} alt={ev.title} fill unoptimized className="w-full h-full object-cover" /></div> : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center shrink-0 p-2 text-center">{isNotif ? <Megaphone size={20} className="text-amber-500 mb-1" /> : <FileText size={20} className="text-zinc-600 mb-1" />}<span className="text-[8px] font-mono text-zinc-600 uppercase">Text Only</span></div>}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[8px] font-mono font-bold tracking-widest border px-2 py-0.5 rounded uppercase ${isNotif ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-brandRed/10 border-brandRed/20 text-brandRed"}`}>{isNotif ? "Announcement" : "Event"}</span>
                        <span className="text-[8px] font-mono font-bold tracking-widest text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">{ev.category || "General"}</span>
                        {ev.date && <span className="text-[9px] font-mono text-zinc-400">{ev.date} {ev.time && `• ${ev.time}`}</span>}
                      </div>
                      <h4 className="font-heading font-black text-sm text-white uppercase truncate">{ev.title}</h4>
                      <p className="text-zinc-400 text-xs line-clamp-2 font-light">{ev.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button onClick={() => setEditingEventId(ev.id)} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white cursor-pointer"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteEvent(ev.id, ev.title, ev.type)} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-brandRed hover:bg-brandRed text-zinc-400 hover:text-white cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
