"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, MapPin, Tag, Loader2, X, Maximize2, FileText, 
  Bell, BellOff, BellRing, Megaphone, Dumbbell, Layers, CheckCircle2, AlertCircle 
} from "lucide-react";

function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "PUSH_NOTIFICATION_RECEIVED") {
            const notif = event.data.notification;
            const notifTitle = notif?.title || "AN Fitness Notification";
            const notifBody = notif?.body || "New update received!";
            setPushStatusMsg(`🔔 ${notifTitle}: ${notifBody}`);
          }
        });
      }
    }

    loadItems();
    checkPushStatus();
  }, []);

  const handleTogglePush = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatusMsg("Push notifications are not supported in this browser.");
      return;
    }

    setSubscribing(true);
    setPushStatusMsg(null);

    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      
      if (isSubscribed) {
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          await existingSub.unsubscribe().catch(() => {});
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: existingSub.endpoint }),
          }).catch(() => {});
        }
        setIsSubscribed(false);
        setPushStatusMsg("Push notifications disabled.");
        return;
      }

      
      if (Notification.permission === "denied") {
        setPushStatusMsg("Notifications are blocked in browser settings. Click the lock icon in the address bar to allow Notifications.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatusMsg("Notification permission was not granted.");
        return;
      }

      const keyRes = await fetch("/api/push/subscribe");
      const keyData = await keyRes.json();
      if (!keyRes.ok || !keyData.publicKey) {
        throw new Error(keyData.error || "Failed to retrieve VAPID public key");
      }

      const existingSub = await reg.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe().catch(() => {});
      }

      const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });

      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: newSub.toJSON() }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || "Failed to save subscription");
      }

      setIsSubscribed(true);
      setPushStatusMsg("Push alerts enabled successfully!");
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
              <span className={`text-[11px] font-mono mt-1 flex items-center gap-1 ${isSubscribed ? "text-emerald-400" : "text-amber-400"}`}>
                <AlertCircle size={12} /> {pushStatusMsg}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleTogglePush}
          disabled={subscribing}
          className={`shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs uppercase font-bold tracking-wider transition-all duration-300 z-10 cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
            activeTab === "notification"
              ? "bg-zinc-800 text-white border border-zinc-700 shadow-md"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <Megaphone size={14} className={activeTab === "notification" ? "text-amber-400" : ""} />
          <span>NOTIFICATIONS & ANNOUNCEMENTS</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === "notification" ? "bg-amber-500 text-black" : "bg-zinc-900 text-zinc-400"}`}>
            {notificationsCount}
          </span>
        </button>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-zinc-900/20 border border-zinc-800/60 rounded-3xl p-8 flex flex-col items-center justify-center gap-3">
          <FileText size={40} className="text-zinc-700" />
          <h4 className="font-heading uppercase font-bold text-zinc-400 text-sm">NO POSTS IN THIS CATEGORY</h4>
          <p className="text-zinc-600 text-xs max-w-sm">
            Check back later for new fitness workshops, announcements, and gym updates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const isNotification = item.type === "notification";

            return (
              <div
                key={item.id}
                className={`bg-zinc-900/30 border rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 group backdrop-blur-sm ${
                  isNotification ? "border-amber-500/30 hover:border-amber-500/50" : "border-zinc-800/80"
                }`}
              >
                <div>
                  {item.posterUrl && (
                    <div
                      onClick={() => setActivePoster({ url: item.posterUrl!, title: item.title })}
                      className="relative w-full h-48 sm:h-56 overflow-hidden bg-zinc-950 cursor-pointer group/poster"
                    >

                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/poster:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-mono text-xs uppercase font-bold">
                        <Maximize2 size={16} /> Click to View Poster
                      </div>
                    </div>
                  )}

                  <div className="p-6 flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-[9px] font-mono uppercase font-bold tracking-widest px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                          isNotification
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-brandRed/10 border-brandRed/20 text-brandRed"
                        }`}
                      >
                        {isNotification ? <Megaphone size={12} /> : <Tag size={12} />}
                        {item.category || (isNotification ? "Announcement" : "Event")}
                      </span>

                      {item.date && (
                        <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                          <Calendar size={12} className="text-zinc-500" />
                          {item.date}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <h3 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight leading-snug group-hover:text-brandRed transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-light whitespace-pre-line">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                {(item.time || item.location) && (
                  <div className="px-6 py-4 border-t border-zinc-800/60 bg-zinc-950/40 flex flex-wrap gap-4 text-xs font-mono text-zinc-400">
                    {item.time && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-brandRed shrink-0" />
                        <span>{item.time}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-brandRed shrink-0" />
                        <span className="truncate max-w-[200px]">{item.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activePoster && (
        <div
          onClick={() => setActivePoster(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-3">
            <button
              onClick={() => setActivePoster(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <img
              src={activePoster.url}
              alt={activePoster.title}
              className="max-h-[80vh] w-auto object-contain rounded-2xl border border-zinc-800 shadow-2xl"
            />
            <span className="font-heading uppercase font-bold text-sm text-zinc-300 tracking-wider">
              {activePoster.title}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
