"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Save, Trash2, Edit2, X, Check, Loader2 } from "lucide-react";

interface MembershipCard {
  id: string;
  name: string;
  price: number;
  billing: string;
  features: string | string[];
  popular: number;
  badge: string;
}

interface AdminMembershipsProps {
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminMemberships({ addToast }: AdminMembershipsProps) {
  const [memberships, setMemberships] = useState<MembershipCard[]>([]);
  const [editingMembershipId, setEditingMembershipId] = useState<string | null>(null);
  const [newMembership, setNewMembership] = useState<MembershipCard | null>(null);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);

  const fetchMemberships = useCallback(async () => {
    setIsLoadingMemberships(true);
    try {
      const res = await fetch("/api/memberships");
      const data = await res.json();
      if (res.ok) setMemberships(data);
      else throw new Error(data.error);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load memberships", "error");
    } finally {
      setIsLoadingMemberships(false);
    }
  }, [addToast]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  const handleSaveMembership = async (membership: MembershipCard, isNew = false) => {
    try {
      let parsedFeatures = membership.features;
      if (typeof parsedFeatures === "string") parsedFeatures = parsedFeatures.split("\n").map(f => f.trim()).filter(Boolean);
      const payload = { ...membership, features: parsedFeatures };
      const endpoint = isNew ? "/api/memberships" : `/api/memberships/${membership.id}`;
      const res = await fetch(endpoint, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      addToast(`Membership "${membership.name}" saved!`);
      setEditingMembershipId(null); setNewMembership(null); fetchMemberships();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to save", "error");
    }
  };

  const handleDeleteMembership = async (id: string) => {
    if (!confirm("Delete this membership plan?")) return;
    try {
      const res = await fetch(`/api/memberships/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      addToast("Membership deleted!");
      fetchMemberships();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to delete", "error");
    }
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
      {(newMembership || memberships.length === 0) && (
        <div className="border border-dashed border-zinc-800 rounded-3xl p-6 bg-zinc-900/10">
          <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-6 pl-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brandRed" />
            {newMembership ? "Creating New Pricing Plan" : "No Plans. Create one."}
          </h3>
          {newMembership ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="relative bg-zinc-900/40 border-2 border-brandRed/40 rounded-3xl p-8 sm:p-10 bg-gradient-to-b from-zinc-900/50 to-transparent backdrop-blur-sm shadow-2xl flex flex-col justify-between min-h-[350px]">
                <div>
                  <div className="mb-4"><input type="text" value={newMembership.badge} onChange={(e) => setNewMembership({ ...newMembership, badge: e.target.value.toUpperCase() })} placeholder="BADGE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase placeholder-zinc-700 outline-none w-full" /></div>
                  <div className="mb-4"><input type="text" value={newMembership.name} onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })} placeholder="PLAN NAME" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm font-black text-white placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2 uppercase" /></div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <input type="number" value={newMembership.price || ""} onChange={(e) => setNewMembership({ ...newMembership, price: Number(e.target.value) })} placeholder="PRICE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-sm font-black text-brandRed placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2" />
                    <input type="text" value={newMembership.billing} onChange={(e) => setNewMembership({ ...newMembership, billing: e.target.value })} placeholder="/ month" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 placeholder-zinc-700 rounded-md outline-none w-full px-3 py-2" />
                  </div>
                  <div className="w-8 h-[2px] bg-brandRed/60 mb-4" />
                  <div className="mb-4"><label className="text-[9px] font-mono text-zinc-500 uppercase block mb-1">Features</label><textarea value={newMembership.features as string} onChange={(e) => setNewMembership({ ...newMembership, features: e.target.value })} placeholder="Full gym access" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 placeholder-zinc-700 rounded-md outline-none w-full h-24 px-3 py-2 resize-none" /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="newPlanPopular" checked={newMembership.popular === 1} onChange={(e) => setNewMembership({ ...newMembership, popular: e.target.checked ? 1 : 0 })} className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer" /><label htmlFor="newPlanPopular" className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">Highlight Card</label></div>
                </div>
                <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800/40">
                  <button onClick={() => handleSaveMembership(newMembership, true)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"><Check size={14} />Save Plan</button>
                  <button onClick={() => setNewMembership(null)} className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase py-2.5 rounded-lg transition-colors cursor-pointer"><X size={14} />Cancel</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={() => setNewMembership({ id: `plan-${Date.now()}`, name: "", price: 0, billing: "/ month", features: "", popular: 0, badge: "" })} className="w-full flex items-center justify-center gap-2 border border-dashed border-zinc-800 hover:border-brandRed/40 py-8 rounded-2xl text-zinc-500 hover:text-brandRed text-xs font-mono uppercase tracking-widest transition-all cursor-pointer"><Plus size={16} />Initialize First Plan</button>
          )}
        </div>
      )}
      {isLoadingMemberships ? (
        <div className="py-20 flex justify-center items-center"><Loader2 size={32} className="animate-spin text-brandRed" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {memberships.map((membership) => {
            const isEditing = editingMembershipId === membership.id;
            const featuresList = getFeaturesArray(membership.features);
            const featuresStr = getFeaturesString(membership.features);
            return (
              <div key={membership.id} className={`relative rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-xl group flex flex-col justify-between ${isEditing ? "border-2 border-brandRed/50 bg-zinc-900/20" : membership.popular ? "border-2 border-brandRed bg-zinc-900/10 shadow-[0_0_20px_rgba(214,26,31,0.15)]" : "border border-zinc-900/80 hover:border-zinc-800 bg-zinc-900/10"}`}>
                {!isEditing && membership.popular === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brandRed text-white text-[8px] font-mono font-bold tracking-widest px-3 py-1 rounded-full uppercase shadow-md">{membership.badge || "RECOMMENDED"}</div>}
                {isEditing ? (
                  <div className="space-y-4">
                    <div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Badge</label><input type="text" defaultValue={membership.badge} onChange={(e) => membership.badge = e.target.value.toUpperCase()} placeholder="BADGE" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-[9px] font-mono tracking-widest text-brandRed bg-brandRed/5 px-3 py-1.5 rounded-md uppercase outline-none w-full" /></div>
                    <div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Name</label><input type="text" defaultValue={membership.name} onChange={(e) => membership.name = e.target.value} placeholder="NAME" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs font-black text-white rounded-md outline-none w-full px-3 py-2 uppercase" /></div>
                    <div className="grid grid-cols-2 gap-2"><div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Price</label><input type="number" defaultValue={membership.price} onChange={(e) => membership.price = Number(e.target.value)} className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-brandRed font-black rounded-md outline-none w-full px-3 py-2" /></div><div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Billing</label><input type="text" defaultValue={membership.billing} onChange={(e) => membership.billing = e.target.value} className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-400 rounded-md outline-none w-full px-3 py-2" /></div></div>
                    <div><label className="text-[8px] font-mono text-zinc-500 uppercase block mb-1">Features</label><textarea defaultValue={featuresStr} onChange={(e) => membership.features = e.target.value} placeholder="FEATURES" className="bg-zinc-950 border border-zinc-800 focus:border-brandRed text-xs text-zinc-300 rounded-md outline-none w-full h-24 px-3 py-2 resize-none" /></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id={`pop-${membership.id}`} defaultChecked={membership.popular === 1} onChange={(e) => membership.popular = e.target.checked ? 1 : 0} className="rounded border-zinc-800 bg-zinc-950 text-brandRed focus:ring-0 w-4 h-4 cursor-pointer" /><label htmlFor={`pop-${membership.id}`} className="text-xs text-zinc-400 uppercase tracking-widest select-none cursor-pointer">Highlight</label></div>
                    <div className="flex gap-2 pt-4 border-t border-zinc-800/40 mt-4"><button onClick={() => handleSaveMembership(membership, false)} className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase py-2 rounded-md transition-colors cursor-pointer"><Save size={10} />Save</button><button onClick={() => setEditingMembershipId(null)} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[10px] uppercase py-2 rounded-md transition-colors cursor-pointer"><X size={10} />Cancel</button></div>
                  </div>
                ) : (
                  <div className="flex flex-col justify-between h-full min-h-[280px]">
                    <div>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight leading-none mb-1">{membership.name}</h3>
                      <div className="flex items-baseline gap-1 mb-3"><span className="font-heading font-black text-2xl sm:text-3xl text-brandRed">₹{membership.price}</span><span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">{membership.billing}</span></div>
                      <div className="w-8 h-[1px] bg-brandRed/60 mb-4" />
                      <ul className="flex flex-col gap-2 mb-6">{featuresList.map((feat: string, fidx: number) => (<li key={fidx} className="flex items-start gap-2 text-zinc-400 text-xs font-light"><Check size={12} className="text-brandRed shrink-0 mt-0.5" /><span>{feat}</span></li>))}</ul>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-zinc-900/50">
                      <button onClick={() => setEditingMembershipId(membership.id)} className="flex-1 flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/50 text-white font-bold text-xs uppercase py-2 rounded-lg transition-colors cursor-pointer"><Edit2 size={10} />Edit</button>
                      <button onClick={() => handleDeleteMembership(membership.id)} className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 hover:bg-brandRed hover:border-brandRed text-zinc-500 hover:text-white transition-all cursor-pointer" title="Delete"><Trash2 size={12} /></button>
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
