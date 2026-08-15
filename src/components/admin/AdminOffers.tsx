"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Save, Trash2, Edit2, X, Check, Loader2, Megaphone } from "lucide-react";

interface OfferCard {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  badge: string;
  features: string | string[];
  whatsappText: string;
  active: number;
}

interface AdminOffersProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

const generateWhatsappMessage = (title: string, price: string, subtitle: string) => {
  const cleanTitle = title.trim();
  const cleanPrice = price.trim() === "₹" ? "" : price.trim();
  const cleanSubtitle = subtitle.trim();
  let msg = "Hi AN Fitness, I want to claim the offer";
  if (cleanTitle) msg += `: ${cleanTitle}`;
  if (cleanPrice) msg += ` for ${cleanPrice}`;
  if (cleanSubtitle) msg += ` (${cleanSubtitle})`;
  return msg;
};

export default function AdminOffers({ addToast }: AdminOffersProps) {
  const [offers, setOffers] = useState<OfferCard[]>([]);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [newOffer, setNewOffer] = useState<OfferCard | null>(null);
  const [isWhatsappDirty, setIsWhatsappDirty] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);

  
  const [announcementBadge, setAnnouncementBadge] = useState("NEW");
  const [announcementText, setAnnouncementText] = useState("REFER 4 FRIENDS & GET 1 MONTH FREE!");
  const [announcementActive, setAnnouncementActive] = useState(true);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const fetchOffers = useCallback(async () => {
    setIsLoadingOffers(true);
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      if (res.ok) setOffers(data);
      else throw new Error(data.error);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load offers", "error");
    } finally {
      setIsLoadingOffers(false);
    }
  }, [addToast]);

  const fetchAnnouncement = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setAnnouncementBadge(data.badge || "");
        setAnnouncementText(data.text || "");
        setAnnouncementActive(data.active === 1);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchOffers();
    fetchAnnouncement();
  }, [fetchOffers, fetchAnnouncement]);

  const handleSaveOffer = async (offer: OfferCard, isNew = false) => {
    try {
      let parsedFeatures = offer.features;
      if (typeof parsedFeatures === "string") {
        parsedFeatures = parsedFeatures.split("\n").map(f => f.trim()).filter(Boolean);
      }
      const payload = { ...offer, features: parsedFeatures };
      const endpoint = isNew ? "/api/offers" : `/api/offers/${offer.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save offer");
      addToast(`Offer "${offer.title}" saved successfully!`);
      setEditingOfferId(null);
      setNewOffer(null);
      fetchOffers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save offer", "error");
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer card?")) return;
    try {
      const res = await fetch(`/api/offers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete offer");
      addToast("Offer deleted successfully!");
      fetchOffers();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete offer", "error");
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) { addToast("Announcement text is required.", "error"); return; }
    setIsSavingAnnouncement(true);
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ badge: announcementBadge, text: announcementText, active: announcementActive }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save announcement");
      addToast("Announcement banner updated successfully!", "success");
    } catch { addToast("Couldn't save announcement.", "error"); }
    finally { setIsSavingAnnouncement(false); }
  };

  const getFeaturesArray = (features: string | string[]): string[] => {
    if (Array.isArray(features)) return features;
    if (typeof features === "string") {
      try { const p = JSON.parse(features); if (Array.isArray(p)) return p; } catch {}
      return features.split("\n").map(f => f.trim()).filter(Boolean);
    }
    return [];
  };
  const getFeaturesString = (features: string | string[]): string => {
    if (Array.isArray(features)) return features.join("\n");
    if (typeof features === "string") { try { const p = JSON.parse(features); if (Array.isArray(p)) return p.join("\n"); } catch { return features; } }
    return "";
  };

  return (
    <div className="flex flex-col gap-8">

      <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
        <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight mb-6 flex items-center gap-3">
          <Megaphone className="text-brandRed" size={20} />
          HOMEPAGE ANNOUNCEMENT BANNER
        </h3>
        <form onSubmit={handleSaveAnnouncement} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">Badge Text</label>
            <input type="text" value={announcementBadge} onChange={(e) => setAnnouncementBadge(e.target.value.toUpperCase())} placeholder="NEW" className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all" disabled={isSavingAnnouncement} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">Banner Text</label>
            <input type="text" value={announcementText} onChange={(e) => setAnnouncementText(e.target.value)} placeholder="REFER 4 FRIENDS & GET 1 MONTH FREE!" className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all" required disabled={isSavingAnnouncement} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group/check select-none py-2 shrink-0">
              <input type="checkbox" checked={announcementActive} onChange={(e) => setAnnouncementActive(e.target.checked)} className="sr-only" disabled={isSavingAnnouncement} />
              <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${announcementActive ? 'bg-brandRed border-brandRed' : 'border-zinc-800 bg-zinc-950/80 group-hover/check:border-zinc-700'}`}>
                {announcementActive && <svg className="w-2.5 h-2.5 text-white fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
              </div>
              <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest group-hover/check:text-zinc-300 transition-colors">Show Banner</span>
            </label>
            <button type="submit" disabled={isSavingAnnouncement} className="flex-1 flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 text-white font-black tracking-widest text-xs uppercase py-3 rounded-xl shadow-lg transition-all cursor-pointer">
              {isSavingAnnouncement ? <><Loader2 size={14} className="animate-spin" />SAVING...</> : "SAVE BANNER"}
            </button>
          </div>
        </form>
      </div>

      {(newOffer || offers.length === 0) && (
        <div className="border border-dashed border-zinc-800 rounded-3xl p-6 bg-zinc-900/10">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 pl-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brandRed" />
            {newOffer ? "Creating New Offer Card" : "No Offers Present. Create one now."}
          </h3>
          {newOffer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="relative bg-zinc-900/40 border-2 border-brandRed/40 rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-zinc-900/50 to-transparent backdrop-blur-sm shadow-2xl flex flex-col justify-between min-h-[350px]">
                <div>
                  <div className="mb-4"><input type="text" value={newOffer.badge} onChange={(e) => setNewOffer({ ...newOffer, badge: e.target.value.toUpperCase() })} placeholder="BADGE (e.g. MONSOON SPECIAL)" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase placeholder-zinc-700 outline-none w-full" /></div>
                  <div className="mb-4"><input type="text" value={newOffer.title} onChange={(e) => { const val = e.target.value; const updated = { ...newOffer, title: val }; if (!isWhatsappDirty) updated.whatsappText = generateWhatsappMessage(val, newOffer.price, newOffer.subtitle); setNewOffer(updated); }} placeholder="CARD TITLE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm sm:text-base font-black text-white placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2 uppercase" /></div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <input type="text" value={newOffer.price} onChange={(e) => { const val = e.target.value; const updated = { ...newOffer, price: val }; if (!isWhatsappDirty) updated.whatsappText = generateWhatsappMessage(newOffer.title, val, newOffer.subtitle); setNewOffer(updated); }} placeholder="PRICE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm font-black text-brandRed placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2" />
                    <input type="text" value={newOffer.subtitle} onChange={(e) => { const val = e.target.value; const updated = { ...newOffer, subtitle: val }; if (!isWhatsappDirty) updated.whatsappText = generateWhatsappMessage(newOffer.title, newOffer.price, val); setNewOffer(updated); }} placeholder="SUBTITLE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2" />
                  </div>
                  <div className="w-8 h-[2px] bg-brandRed/60 mb-4" />
                  <div className="mb-4"><label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Features (One per line)</label><textarea value={newOffer.features as string} onChange={(e) => setNewOffer({ ...newOffer, features: e.target.value })} placeholder="Full gym access for 2 persons" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 placeholder-zinc-700 rounded-md outline-none w-full h-20 px-3 py-2 resize-none" /></div>
                  <div className="mb-4"><label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">WhatsApp message</label><input type="text" value={newOffer.whatsappText} onChange={(e) => { setIsWhatsappDirty(true); setNewOffer({ ...newOffer, whatsappText: e.target.value }); }} placeholder="Hi AN Fitness..." className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[10px] text-zinc-400 placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2" /></div>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="checkbox" id="newOfferActive" checked={newOffer.active === 1} onChange={(e) => setNewOffer({ ...newOffer, active: e.target.checked ? 1 : 0 })} className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer" />
                    <label htmlFor="newOfferActive" className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">Render Active on Homepage</label>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800/40">
                  <button onClick={() => handleSaveOffer(newOffer, true)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"><Check size={14} />Save Card</button>
                  <button onClick={() => setNewOffer(null)} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"><X size={14} />Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => { setNewOffer({ id: `offer-${Date.now()}`, title: "", subtitle: "2 Persons Access", price: "₹", badge: "", features: "", whatsappText: "Hi AN Fitness, I want to claim the offer", active: 1 }); setIsWhatsappDirty(false); }} className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-800 hover:border-brandRed/40 py-8 rounded-2xl text-zinc-500 hover:text-brandRed text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"><Plus size={16} />Initialize First Campaign Card</button>
          )}
        </div>
      )}

      {isLoadingOffers ? (
        <div className="py-20 flex justify-center items-center"><Loader2 size={32} className="animate-spin text-brandRed" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {offers.map((offer) => {
            const isEditing = editingOfferId === offer.id;
            const featuresList = getFeaturesArray(offer.features);
            const featuresStr = getFeaturesString(offer.features);
            return (
              <div key={offer.id} className={`relative rounded-3xl p-8 sm:p-10 transition-all duration-300 shadow-xl group flex flex-col justify-between ${isEditing ? "border-2 border-brandRed/50 bg-zinc-900/20" : "border border-zinc-900/80 hover:border-zinc-800 bg-zinc-900/10 bg-gradient-to-b from-zinc-900/30 to-transparent"}`}>
                {!isEditing && <div className={`absolute top-4 right-4 text-[8px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-md ${offer.active ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700/50"}`}>{offer.active ? "LIVE ON HOMEPAGE" : "DRAFT/INACTIVE"}</div>}
                {isEditing ? (
                  <div className="space-y-4">
                    <div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Badge Ribbon</label><input type="text" defaultValue={offer.badge} onChange={(e) => offer.badge = e.target.value.toUpperCase()} placeholder="BADGE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase outline-none w-full" /></div>
                    <div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Title</label><input type="text" defaultValue={offer.title} onChange={(e) => offer.title = e.target.value} placeholder="TITLE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm font-black text-white rounded-md outline-none w-full px-3 py-2 uppercase" /></div>
                    <div className="grid grid-cols-2 gap-3"><div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Price</label><input type="text" defaultValue={offer.price} onChange={(e) => offer.price = e.target.value} placeholder="PRICE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs font-black text-brandRed rounded-md outline-none w-full px-3 py-2" /></div><div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Subtitle</label><input type="text" defaultValue={offer.subtitle} onChange={(e) => offer.subtitle = e.target.value} placeholder="SUBTITLE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 rounded-md outline-none w-full px-3 py-2" /></div></div>
                    <div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Features</label><textarea defaultValue={featuresStr} onChange={(e) => offer.features = e.target.value} placeholder="FEATURES" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 rounded-md outline-none w-full h-20 px-3 py-2 resize-none" /></div>
                    <div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">WhatsApp</label><input type="text" defaultValue={offer.whatsappText} onChange={(e) => offer.whatsappText = e.target.value} placeholder="WHATSAPP MSG" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[10px] text-zinc-400 rounded-md outline-none w-full px-3 py-2" /></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id={`active-${offer.id}`} defaultChecked={offer.active === 1} onChange={(e) => offer.active = e.target.checked ? 1 : 0} className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer" /><label htmlFor={`active-${offer.id}`} className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">Active on Homepage</label></div>
                    <div className="flex gap-2 pt-4 border-t border-zinc-800/40 mt-4"><button onClick={() => handleSaveOffer(offer, false)} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase py-2 rounded-md transition-colors cursor-pointer"><Save size={12} />Save</button><button onClick={() => setEditingOfferId(null)} className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase py-2 rounded-md transition-colors cursor-pointer"><X size={12} />Cancel</button></div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full min-h-[250px]">
                    <div>
                      {offer.badge && <span className="inline-block text-[8px] font-mono tracking-widest text-brandRed bg-brandRed/10 border border-brandRed/20 px-2 py-0.5 rounded-full uppercase mb-4 font-bold">{offer.badge}</span>}
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-tight leading-none mb-1 pr-16">{offer.title}</h3>
                      <div className="flex items-baseline gap-2 mb-3"><span className="font-heading font-black text-2xl sm:text-3xl text-brandRed">{offer.price}</span><span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">{offer.subtitle}</span></div>
                      <div className="w-8 h-[1px] bg-brandRed/60 mb-4" />
                      <ul className="flex flex-col gap-2 mb-6">{featuresList.map((feat: string, fidx: number) => (<li key={fidx} className="flex items-start gap-2 text-zinc-400 text-xs font-light"><Check size={12} className="text-brandRed shrink-0 mt-0.5" /><span>{feat}</span></li>))}</ul>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-zinc-900 bg-zinc-900/5">
                      <button onClick={() => setEditingOfferId(offer.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 hover:border-zinc-600 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"><Edit2 size={12} />Edit Card</button>
                      <button onClick={() => handleDeleteOffer(offer.id)} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 hover:bg-brandRed hover:border-brandRed text-zinc-500 hover:text-white transition-all cursor-pointer" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
