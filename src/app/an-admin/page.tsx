"use client";

export const runtime = "edge";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Dumbbell, Image as ImageIcon, Calendar,
  Video, Key, LogOut, Loader2, ShoppingBag, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import AdminOffers from "@/components/admin/AdminOffers";
import AdminMemberships from "@/components/admin/AdminMemberships";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminEvents from "@/components/admin/AdminEvents";
import AdminBanner from "@/components/admin/AdminBanner";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminShop from "@/components/admin/AdminShop";

type Tab = "offers" | "memberships" | "gallery" | "events" | "banner" | "shop" | "settings";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("offers");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUsername(data.username);
        } else {
          setIsAuthenticated(false);
          router.push("/an-admin/login");
        }
      } catch {
        setIsAuthenticated(false);
        router.push("/an-admin/login");
      }
    }
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/an-admin/login");
      router.refresh();
    } catch {
      router.push("/an-admin/login");
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin text-brandRed mb-4" />
        <span className="text-xs uppercase tracking-widest font-mono text-zinc-500">Checking sign-in...</span>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "offers", label: "Special Offers", icon: <Sparkles size={16} /> },
    { id: "memberships", label: "Memberships", icon: <Dumbbell size={16} /> },
    { id: "gallery", label: "Gallery", icon: <ImageIcon size={16} /> },
    { id: "events", label: "Events", icon: <Calendar size={16} /> },
    { id: "shop", label: "Shop", icon: <ShoppingBag size={16} /> },
    { id: "banner", label: "Home Promo", icon: <Video size={16} /> },
    { id: "settings", label: "Change Password", icon: <Key size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto">
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brandRed animate-pulse shadow-[0_0_8px_#D61A1F]" />
            <h2 className="font-heading font-black tracking-widest text-lg uppercase">AN FITNESS</h2>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mt-1 block">ADMIN</span>
        </div>

        <nav className="flex-1 p-3 sm:p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible scrollbar-none snap-x">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 md:w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 sm:gap-3 cursor-pointer whitespace-nowrap snap-start",
                activeTab === tab.id
                  ? "bg-brandRed text-white shadow-lg shadow-brandRed/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-900 bg-zinc-950/90 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-mono">Logged in as</span>
            <span className="text-xs font-bold text-white max-w-[120px] truncate">{username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-brandRed hover:border-brandRed text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 md:p-10 md:max-h-screen md:overflow-y-auto relative bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(63,0,2,0.15),rgba(255,255,255,0))] min-w-0">

        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 flex flex-col gap-3 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className={cn(
                "pointer-events-auto cursor-pointer p-4 rounded-xl border shadow-2xl flex items-center gap-3 transition-all hover:scale-102",
                toast.type === "error"
                  ? "bg-zinc-950 border-brandRed/30 text-brandRed-light"
                  : toast.type === "info"
                  ? "bg-zinc-950 border-blue-500/30 text-blue-400"
                  : "bg-zinc-950 border-emerald-500/30 text-emerald-400"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full shrink-0",
                toast.type === "error" ? "bg-brandRed animate-pulse" : toast.type === "info" ? "bg-blue-500" : "bg-emerald-500 animate-ping"
              )} />
              <span className="text-[11px] font-medium leading-relaxed">{toast.message}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setToasts((prev) => prev.filter((t) => t.id !== toast.id)); }}
                className="ml-auto text-zinc-600 hover:text-white transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl text-white uppercase tracking-tight">
              {tabs.find(t => t.id === activeTab)?.label || "DASHBOARD"}
            </h1>
            <p className="text-zinc-500 text-xs mt-1">
              {activeTab === "offers" && "Update homepage slider campaigns claimed via WhatsApp"}
              {activeTab === "memberships" && "Update pricing grid options shown on memberships page"}
              {activeTab === "gallery" && "Upload and delete photos and videos in your gym gallery"}
              {activeTab === "events" && "Manage upcoming events, workshops, and announcements"}
              {activeTab === "shop" && "Add and remove products from the shop catalog"}
              {activeTab === "banner" && "Video/audio popup on the homepage"}
              {activeTab === "settings" && "Configure passwords and admin session boundaries"}
            </p>
          </div>
        </header>

        {activeTab === "offers" && <AdminOffers addToast={addToast} />}
        {activeTab === "memberships" && <AdminMemberships addToast={addToast} />}
        {activeTab === "gallery" && <AdminGallery addToast={addToast} />}
        {activeTab === "events" && <AdminEvents addToast={addToast} />}
        {activeTab === "shop" && <AdminShop addToast={addToast} />}
        {activeTab === "banner" && <AdminBanner addToast={addToast} />}
        {activeTab === "settings" && <AdminSettings />}
      </main>
    </div>
  );
}
