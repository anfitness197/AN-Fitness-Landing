"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Tag, Loader2, X, Maximize2, FileText } from "lucide-react";

interface GymEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  posterUrl: string;
  category: string;
}

export default function EventsList() {
  const [events, setEvents] = useState<GymEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePoster, setActivePoster] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setEvents(data);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-brandRed" />
        <span className="text-xs uppercase tracking-widest font-mono text-zinc-500">Loading Events Schedule...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center border border-zinc-900 rounded-3xl bg-zinc-900/10 flex flex-col items-center gap-3">
        <span className="text-xs uppercase tracking-widest font-mono text-zinc-400">No Events Scheduled Right Now</span>
        <p className="text-zinc-600 text-xs max-w-sm">
          Check back soon or follow our WhatsApp group for real-time club updates and upcoming workshops!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {events.map((event) => {
        const hasPoster = !!event.posterUrl?.trim();

        return (
          <article
            key={event.id}
            className="group bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col md:flex-row gap-6 items-start transition-all duration-300 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brandRed/5 rounded-full blur-2xl pointer-events-none group-hover:bg-brandRed/10 transition-colors" />

            {/* Left Column: Poster Image (If present) */}
            {hasPoster ? (
              <div
                onClick={() => setActivePoster({ url: event.posterUrl, title: event.title })}
                className="w-full md:w-56 lg:w-64 aspect-[3/4] md:aspect-auto md:h-72 rounded-xl sm:rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 relative shrink-0 cursor-pointer group/poster"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.posterUrl}
                  alt={event.title}
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

            {/* Right Column: Event Details & Supporting Content */}
            <div className={`flex-1 flex flex-col justify-between gap-4 w-full ${!hasPoster ? "py-2" : ""}`}>
              <div className="flex flex-col gap-3">
                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-brandRed uppercase bg-brandRed/10 border border-brandRed/20 px-2.5 py-1 rounded">
                    {event.category || "General Event"}
                  </span>
                  {!hasPoster && (
                    <span className="text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded flex items-center gap-1">
                      <FileText size={10} /> Bulletin
                    </span>
                  )}
                </div>

                {/* Event Title */}
                <h2 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white uppercase tracking-tight leading-tight group-hover:text-brandRed-light transition-colors">
                  {event.title}
                </h2>

                {/* Event Metadata Cards */}
                <div className="flex flex-wrap gap-4 text-xs font-mono text-zinc-400 py-1 border-y border-zinc-900/60 my-1">
                  {event.date && (
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Calendar size={14} className="text-brandRed shrink-0" />
                      <span>{event.date}</span>
                    </div>
                  )}
                  {event.time && (
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Clock size={14} className="text-zinc-500 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <MapPin size={14} className="text-zinc-500 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Event Description Body */}
                <div className="text-zinc-300 text-xs sm:text-sm font-light leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-2 flex items-center justify-between">
                <a
                  href={`https://wa.me/919867195346?text=${encodeURIComponent(`Hi AN Fitness, I want to know more about the event: ${event.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase font-bold text-green-500 hover:text-green-400 tracking-widest group/link transition-colors"
                >
                  <span>INQUIRE / REGISTER VIA WHATSAPP</span>
                  <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                </a>
              </div>
            </div>
          </article>
        );
      })}

      {/* Lightbox Poster View */}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
