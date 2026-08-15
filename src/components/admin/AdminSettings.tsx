"use client";

import React from "react";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function AdminSettings() {
  const [oldPassword, setOldPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordStatus, setPasswordStatus] = React.useState({ success: "", error: "", loading: false });

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: "", error: "New passwords do not match.", loading: false });
      return;
    }
    setPasswordStatus({ success: "", error: "", loading: true });
    try {
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Password change failed");
      setPasswordStatus({ success: "Password changed successfully!", error: "", loading: false });
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      setPasswordStatus({
        success: "",
        error: err instanceof Error ? err.message : "Failed to update password.",
        loading: false,
      });
    }
  };

  return (
    <div className="max-w-xl bg-zinc-900/10 border border-zinc-900 rounded-3xl p-8 backdrop-blur-sm">
      <h3 className="font-heading font-black text-lg text-white uppercase tracking-tight mb-6 flex items-center gap-3">
        <ShieldAlert className="text-brandRed" size={20} />
        ADMIN SECURITY SETTING
      </h3>
      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
        {passwordStatus.error && <div className="bg-brandRed/10 border border-brandRed/20 text-brandRed-light text-xs px-4 py-3 rounded-xl">{passwordStatus.error}</div>}
        {passwordStatus.success && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-3 rounded-xl">{passwordStatus.success}</div>}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">Current Password</label>
          <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="••••••••" className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3.5 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all" required disabled={passwordStatus.loading} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="•••••••• (Min 6 characters)" className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3.5 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all" required disabled={passwordStatus.loading} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white px-4 py-3.5 rounded-xl text-xs placeholder-zinc-700 outline-none transition-all" required disabled={passwordStatus.loading} />
        </div>
        <button type="submit" disabled={passwordStatus.loading} className="flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light disabled:bg-zinc-850 text-white font-black tracking-widest text-xs uppercase py-4 rounded-xl shadow-lg transition-all cursor-pointer">
          {passwordStatus.loading ? <><Loader2 size={14} className="animate-spin" />UPDATING...</> : "UPDATE SECURITY CREDENTIALS"}
        </button>
      </form>
    </div>
  );
}
