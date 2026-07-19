import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronLeft, Calendar, Clock, MapPin, Sparkles, Tag, ImageOff } from "lucide-react";
import EventsList from "./events-list";

export const metadata: Metadata = {
  title: "Events & Announcements | AN Fitness Khordha",
  description:
    "Explore upcoming fitness workshops, Zumba masterclasses, powerlifting competitions, and special announcements at AN Fitness - the best gym in Khordha.",
  keywords: [
    "AN Fitness events",
    "gym events Khordha",
    "zumba workshop Khordha",
    "powerlifting competition Khordha",
    "fitness events Odisha",
    "AN Fitness announcements",
    "best gym in khordha events"
  ],
  openGraph: {
    title: "Events & Announcements | AN Fitness Khordha",
    description:
      "Explore upcoming fitness workshops, Zumba masterclasses, powerlifting competitions, and special announcements at AN Fitness.",
    url: "https://anfitness.in/events",
  },
  alternates: {
    canonical: "/events",
  },
};

export default function EventsPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between overflow-x-hidden text-white pt-20 sm:pt-24 pb-12 sm:pb-16">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] bg-brandRed/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col gap-6 sm:gap-10">
        <div className="self-start">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-widest">
            <ChevronLeft size={14} />
            BACK TO DECK
          </Link>
        </div>

        <div className="text-left flex flex-col gap-2 sm:gap-3">
          <span className="text-[9px] sm:text-[10px] text-brandRed font-mono font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] bg-brandRed/10 px-3 py-1 rounded self-start">
            COMMUNITY & BULLETIN
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-6xl text-white uppercase tracking-tight leading-none">
            EVENTS & ANNOUNCEMENTS
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-xl font-light">
            Stay updated with upcoming fitness workshops, Zumba masterclasses, powerlifting challenges, and club notices at AN Fitness Khordha.
          </p>
        </div>

        <EventsList />
      </div>
    </div>
  );
}
