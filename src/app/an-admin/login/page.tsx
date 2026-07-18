"use client";

export const runtime = "edge";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const remembered = localStorage.getItem("an_admin_remembered_username");
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid username or password");
      }

      if (rememberMe) {
        localStorage.setItem("an_admin_remembered_username", username);
      } else {
        localStorage.removeItem("an_admin_remembered_username");
      }

      router.push("/an-admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brandRed/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="inline-block text-[10px] font-mono tracking-[0.3em] font-black text-brandRed bg-brandRed/10 border border-brandRed/20 px-3 py-1 rounded-full uppercase mb-4 shadow-lg shadow-brandRed/5">
            ATHLETE CONTROL DECK
          </span>
          <h1 className="font-heading font-black text-4xl sm:text-5xl text-white tracking-tight leading-none uppercase">
            AN FITNESS
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-light mt-2 tracking-wide uppercase">
            Sign in to manage the gym facility
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-brandRed/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
            {error && (
              <div className="bg-brandRed/10 border border-brandRed/20 text-brandRed-light text-xs font-medium px-4 py-3.5 rounded-xl animate-shake flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brandRed animate-pulse shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500 pointer-events-none">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white pl-11 pr-4 py-3.5 rounded-xl text-sm placeholder-zinc-600 outline-none transition-all duration-300 shadow-inner"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest pl-1">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-500 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 focus:border-brandRed text-white pl-11 pr-12 py-3.5 rounded-xl text-sm placeholder-zinc-600 outline-none transition-all duration-300 shadow-inner"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pl-1">
              <label className="flex items-center gap-2 cursor-pointer group/check select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                  disabled={isLoading}
                />
                <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${rememberMe ? 'bg-brandRed border-brandRed' : 'border-zinc-800 bg-zinc-950/80 group-hover/check:border-zinc-700'}`}>
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>
                <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest group-hover/check:text-zinc-300 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-brandRed hover:bg-brandRed-light text-white font-black tracking-widest text-xs uppercase py-4 rounded-xl shadow-lg shadow-brandRed/20 hover:shadow-brandRed/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  ENTER CONTROL PANEL
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[10px] text-center text-zinc-600 font-mono mt-6 tracking-wide uppercase">
          Authorized Admin Personnel Only. Session logs are audited.
        </p>
      </div>
    </div>
  );
}
