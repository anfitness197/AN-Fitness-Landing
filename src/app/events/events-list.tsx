"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, MapPin, Tag, Loader2, X, Maximize2, FileText, 
  Bell, BellOff, BellRing, Megaphone, Dumbbell, Layers, CheckCircle2, AlertCircle 
} from "lucide-react";
import { urlBase64ToUint8Array } from "@/lib/push";

interface GymItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  location?: string;
  posterUrl?: string;
  category?: string;
  type?: "event" | "notification";
  created_at?: string;
}

export default function EventsList() {
  const [items, setItems] = useState<GymItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "event" | "notification">("all");
  const [activePoster, setActivePoster] = useState<{ url: string; title: string } | null>(null);

  
  const [pushSupported, setPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [pushStatusMsg, setPushStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadItems() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setItems(data);
        }
      } catch (err) {
        console.error("Failed to load events/notifications:", err);
      } finally {
        setLoading(false);
      }
    }

    async function checkPushStatus() {
      if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
        setPushSupported(true);
        try {
          
          const reg = await navigator.serviceWorker.register("/sw.js");
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            setIsSubscribed(true);
          }
        } catch (e) {
          console.error("Service worker push check error:", e);
        }
      }
    }

    loadItems();
    checkPushStatus();
  }, []);

  const handleTogglePush = async () => {
    if (!pushSupported) {
      setPushStatusMsg("Push notifications are not supported on this browser.");
      return;
    }

    setSubscribing(true);
    setPushStatusMsg(null);

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const existingSub = await reg.pushManager.getSubscription();

      if (isSubscribed && existingSub) {
        
        await existingSub.unsubscribe();
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existingSub.endpoint }),
        });
        setIsSubscribed(false);
        setPushStatusMsg("Unsubscribed from notifications.");
      } else {
        
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setPushStatusMsg("Notification permission was denied in your browser settings.");
          setSubscribing(false);
          return;
        }

        
        const keyRes = await fetch("/api/push/subscribe");
        const keyData = await keyRes.json();

        if (!keyRes.ok || !keyData.publicKey) {
          throw new Error(keyData.error || "Failed to retrieve VAPID key");
        }

        const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

        const newSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
        });

        
        const saveRes = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: newSub.toJSON() }),
        });

        if (!saveRes.ok) {
          const errData = await saveRes.json();
          throw new Error(errData.error || "Failed to save subscription on server");
        }

        setIsSubscribed(true);
        setPushStatusMsg("Subscribed! You will now receive instant push alerts for new events & announcements.");
      }
    } catch (err: any) {
      console.error("Push subscription error:", err);
      setPushStatusMsg(err.message || "Failed to update notification subscription.");
    } finally {
      setSubscribing(false);
    }
  };

  const eventsCount = items.filter((i) => i.type !== "notification").length;
  const notificationsCount = items.filter((i) => i.type === "notification").length;
  const totalCount = items.length;

  const filteredItems = items.filter((item) => {
    if (activeTab === "event") return item.type !== "notification";
    if (activeTab === "notification") return item.type === "notification";
    return true;
  });

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-brandRed" />
        <span className="text-xs uppercase tracking-widest font-mono text-zinc-500">Loading Bulletin & Events...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">

      <div className="bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-zinc-900/80 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-3.5 z-10">
          <div className={`p-3 rounded-xl border ${isSubscribed ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-brandRed/10 border-brandRed/20 text-brandRed"} shrink-0`}>
            {isSubscribed ? <BellRing size={20} className="animate-pulse" /> : <Bell size={20} />}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-heading uppercase font-bold text-sm sm:text-base text-white tracking-wide">
                AN FITNESS PUSH NOTIFICATIONS
              </h3>
              {isSubscribed && (
                <span className="text-[9px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded">
                  SUBSCRIBED
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 font-light max-w-xl">
              Get instant alerts for workshops, class schedules, member offers, and urgent gym announcements directly on your device.
            </p>
            {pushStatusMsg && (
              <span className="text-[11px] font-mono text-brandRed mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {pushStatusMsg}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleTogglePush}
          disabled={subscribing || !pushSupported}
          className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs uppercase font-bold tracking-wider transition-all duration-300 z-10 ${
            isSubscribed
              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
              : "bg-brandRed hover:bg-brandRed-light text-white shadow-lg shadow-brandRed/20"
          } ${subscribing ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {subscribing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>PROCESSING...</span>
            </>
          ) : isSubscribed ? (
            <>
              <BellOff size={14} />
              <span>DISABLE ALERTS</span>
            </>
          ) : (
            <>
              <BellRing size={14} />
              <span>ENABLE PUSH ALERTS</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "all"
              ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <Layers size={14} className={activeTab === "all" ? "text-brandRed" : ""} />
          <span>ALL BULLETIN</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "all" ? "bg-brandRed text-white" : "bg-zinc-900 text-zinc-400"}`}>
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("event")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "event"
              ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <Dumbbell size={14} className={activeTab === "event" ? "text-brandRed" : ""} />
          <span>UPCOMING EVENTS</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "event" ? "bg-brandRed text-white" : "bg-zinc-900 text-zinc-400"}`}>
            {eventsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("notification")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 ${
            activeTab === "notification"
              ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <Megaphone size={14} className={activeTab === "notification" ? "text-amber-500" : ""} />
          <span>NOTIFICATIONS & ANNOUNCEMENTS</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "notification" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"}`}>
            {notificationsCount}
          </span>
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-16 sm:py-24 text-center border border-zinc-900 rounded-3xl bg-zinc-900/10 flex flex-col items-center gap-3">
          <span className="text-xs uppercase tracking-widest font-mono text-zinc-400">
            No {activeTab === "event" ? "Events" : activeTab === "notification" ? "Notifications" : "Items"} Found
          </span>
          <p className="text-zinc-600 text-xs max-w-sm">
            Check back soon or follow our WhatsApp channel for real-time club updates!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-8">
          {filteredItems.map((item) => {
            const hasPoster = !!item.posterUrl?.trim();
            const isNotification = item.type === "notification";

            return (
              <article
                key={item.id}
                className={`group bg-zinc-900/20 border rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row gap-6 items-start transition-all duration-300 shadow-xl relative overflow-hidden ${
                  isNotification ? "border-amber-500/20 hover:border-amber-500/40" : "border-zinc-900 hover:border-zinc-800"
                }`}
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-colors ${
                    isNotification
                      ? "bg-amber-500/5 group-hover:bg-amber-500/10"
                      : "bg-brandRed/5 group-hover:bg-brandRed/10"
                  }`}
                />

                {hasPoster ? (
                  <div
                    onClick={() => setActivePoster({ url: item.posterUrl!, title: item.title })}
                    className="w-full md:w-56 lg:w-64 aspect-[3/4] md:aspect-auto md:h-72 rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 relative shrink-0 cursor-pointer group/poster"
                  >

                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover/poster:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-zinc-950/90 border border-zinc-700 flex items-center justify-center text-white">
                        <Maximize2 size={14} />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className={`flex-1 flex flex-col justify-between gap-4 w-full ${!hasPoster ? "py-2" : ""}`}>
                  <div className="flex flex-col gap-3">

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[8px] sm:text-[9px] font-mono font-bold tracking-widest uppercase border px-2.5 py-1 rounded flex items-center gap-1 ${
                          isNotification
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-brandRed/10 border-brandRed/20 text-brandRed"
                        }`}
                      >
                        {isNotification ? <Megaphone size={10} /> : <Dumbbell size={10} />}
                        {item.category || (isNotification ? "Announcement" : "Event")}
                      </span>

                      {!hasPoster && (
                        <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded flex items-center gap-1">
                          <FileText size={10} /> Text Notice
                        </span>
                      )}
                    </div>

                    <h2
                      className={`font-heading font-black text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-tight leading-tight transition-colors ${
                        isNotification ? "group-hover:text-amber-400" : "group-hover:text-brandRed-light"
                      }`}
                    >
                      {item.title}
                    </h2>

                    {(item.date || item.time || item.location) && (
                      <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-400 py-1 border-y border-zinc-900/60 my-1">
                        {item.date && (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Calendar size={14} className={isNotification ? "text-amber-500 shrink-0" : "text-brandRed shrink-0"} />
                            <span>{item.date}</span>
                          </div>
                        )}
                        {item.time && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock size={14} className="text-zinc-500 shrink-0" />
                            <span>{item.time}</span>
                          </div>
                        )}
                        {item.location && (
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <MapPin size={14} className="text-zinc-500 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-zinc-300 text-xs sm:text-sm font-light leading-relaxed whitespace-pre-line">
                      {item.description}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <a
                      href={`https://wa.me/919867195346?text=${encodeURIComponent(
                        `Hi AN Fitness, I want to inquire about: ${item.title}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase font-bold text-green-500 hover:text-green-400 tracking-widest group/link transition-colors"
                    >
                      <span>INQUIRE / WHATSAPP DESK</span>
                      <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {activePoster && (
        <div
          onClick={() => setActivePoster(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <button
            onClick={() => setActivePoster(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center hover:border-brandRed transition-colors"
          >
            <X size={18} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl max-h-[85vh] p-2 flex flex-col items-center gap-3 cursor-default"
          >

            <img
              src={activePoster.url}
              alt={activePoster.title}
              className="max-w-full max-h-[78vh] object-contain rounded-2xl shadow-2xl border border-zinc-800"
            />
            <span className="text-xs font-heading uppercase text-zinc-300 font-bold">{activePoster.title}</span>
          </div>
        </div>
      )}
    </div>
  );
}
