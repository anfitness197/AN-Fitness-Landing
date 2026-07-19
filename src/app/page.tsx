import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { HeroHeadline } from "@/components/hero-headline";
import { SectionHeader } from "@/components/section-header";
import { FeaturesCarousel } from "@/components/features-carousel";
import { OffersCarousel } from "@/components/offers-carousel";
import { ReviewsMarquee } from "@/components/reviews-marquee";
import { LandingGallery } from "@/components/landing-gallery";
import HeroVideo from "@/components/hero-video";
import { MapPin, Navigation } from "lucide-react";

export const metadata: Metadata = {
  title: "AN Fitness | Best Gym & Training Club | Khordha",
  description:
    "Forge your steel at AN Fitness, Khordha's premier best gym. State-of-the-art strength decks, personal coaching, Zumba classes, and certified coaches.",
  openGraph: {
    title: "AN Fitness | Best Gym & Training Club | Khordha",
    description:
      "Forge your steel at AN Fitness, Khordha's premier best gym. State-of-the-art strength decks, personal coaching, Zumba classes, and certified coaches.",
  },
  alternates: {
    canonical: "/",
  },
};

const homeSections = [
  { label: "Hero", href: "#hero" },
  { label: "Founder", href: "#founder" },
  { label: "Features", href: "#features" },
  { label: "Gallery", href: "#gallery" },
  { label: "Limited Offers", href: "#offers" },
  { label: "Reviews", href: "#testimonials" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      <section id="hero" className="relative h-[85vh] sm:h-[90vh] md:h-screen w-full flex items-center justify-center overflow-hidden">
        <HeroVideo />

        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/40" />
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6 md:px-12 flex flex-col items-center gap-6 sm:gap-8 mt-8 sm:mt-12">
          <HeroHeadline />

          <p className="text-brandRed text-[9px] xs:text-[10px] sm:text-sm md:text-lg lg:text-xl max-w-2xl font-black tracking-[0.2em] sm:tracking-[0.25em] uppercase leading-relaxed mt-2 sm:mt-3">
            YOUR ULTIMATE DESTINATION FOR STRENGTH, FITNESS, AND HEALTH
          </p>

          <p className="text-zinc-400 text-[10px] xs:text-[11px] sm:text-sm md:text-base max-w-lg font-light tracking-wide leading-relaxed">
            Welcome to AN Fitness. Start your journey today with our state-of-the-art strength equipment, and expert personal coaching.
          </p>

          <div className="flex flex-col items-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md mx-auto">
            <Link href="#offers" className="w-full sm:w-auto">
              <RainbowButton as="span" className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-3.5 text-[10px] sm:text-xs md:text-sm font-black tracking-widest uppercase">
                START TRAINING
              </RainbowButton>
            </Link>

            <div className="flex flex-row items-center justify-center gap-2.5 sm:gap-4 w-full">
              <Link href="#features" className="flex-1 sm:flex-initial inline-flex items-center justify-center border border-zinc-800 hover:border-brandRed bg-zinc-950/80 hover:bg-zinc-900/50 backdrop-blur-sm text-white px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-[10px] sm:text-xs md:text-sm font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap">
                EXPLORE
              </Link>
              <Link href="/contact" className="flex-1 sm:flex-initial inline-flex items-center justify-center border border-zinc-800 hover:border-brandRed bg-zinc-950/80 hover:bg-zinc-900/50 backdrop-blur-sm text-white hover:text-white px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-full text-[10px] sm:text-xs md:text-sm font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap">
                CONTACT
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SectionHeader title="THE WORK" links={homeSections} />

      <section id="founder" className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto scroll-mt-24 border-b border-zinc-900/50">
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
          <div className="w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[380px] lg:max-w-[400px] aspect-[3/4] shrink-0 relative rounded-2xl overflow-hidden p-[1px] bg-zinc-900 border border-zinc-800 shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-brandRed/15 to-transparent animate-pulse" />
            <Image
              src="/assets/images/OWNER.webp"
              alt="Anil Mahapatra - Founder of AN Fitness"
              fill
              className="object-cover rounded-2xl relative z-10 filter brightness-95 contrast-105"
              draggable={false}
              sizes="(max-width: 640px) 280px, (max-width: 768px) 380px, 400px"
            />
          </div>

          <div className="flex flex-col items-start gap-4 sm:gap-6 text-left">
            <span className="text-[9px] sm:text-[10px] text-brandRed font-black uppercase tracking-[0.3em] font-mono bg-brandRed/10 px-3 py-1 rounded">
              FOUNDER&apos;S VISION
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-5xl text-white uppercase tracking-tight leading-none">
              FORGED BY BELIEF
            </h2>

            <div className="w-12 h-[2px] bg-brandRed mt-1 sm:mt-2" />

            <div className="text-zinc-300 text-xs sm:text-sm md:text-base font-light leading-relaxed flex flex-col gap-4 sm:gap-5 mt-3 sm:mt-4 max-w-2xl">
              <p>
                &ldquo;I built AN Fitness because I was tired of commercial gym spaces that prioritize aesthetics and vanity over actual hard work. Here, we do not care about shortcuts or fitness trends that promise results without effort. This is a space of discipline.&rdquo;
              </p>
              <p>
                &ldquo;Every single lifting platform, rack, and barbell in this facility was chosen with purpose. We provide a clean, focused, no-excuse training environment alongside coaches who genuinely care about your performance and strength progression.&rdquo;
              </p>
              <p>
                &ldquo;Whether you are stepping onto the floor for the first time or looking to break your personal records, our goal remains simple: show up, respect the work, and build a stronger version of yourself.&rdquo;
              </p>
            </div>

            <div className="flex flex-col mt-4 sm:mt-6">
              <span className="text-xs sm:text-sm uppercase tracking-widest font-black text-white">
                ANIL MAHAPATRA
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-mono mt-1">
                Founder &amp; Head Coach, AN FITNESS
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto scroll-mt-24 flex flex-col gap-8 sm:gap-12">
        <div className="text-center max-w-2xl mx-auto px-4 sm:px-6">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-black text-brandRed">THE STANDARDS</span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-5xl text-white uppercase mt-2">
            WHY TRAIN WITH AN FITNESS
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm md:text-base mt-3 sm:mt-4 font-light">
            We offer top-tier equipment, spacious training floors, and expert coaching to help you get in the best shape of your life.
          </p>
        </div>
        <FeaturesCarousel />
      </section>

      <section id="gallery" className="py-16 sm:py-24 bg-zinc-950 border-t border-zinc-900 scroll-mt-24 flex flex-col gap-8 sm:gap-12">
        <div className="text-center max-w-2xl mx-auto px-4 sm:px-6">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-black text-brandRed">THE CLUB</span>
          <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-5xl text-white uppercase mt-2">
            LATEST FROM TRAINING DECK
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm md:text-base mt-3 sm:mt-4 font-light">
            Check out real training moments, premium facility setups, and heavy lifting decks.
          </p>
        </div>
        <LandingGallery />
      </section>

      <section id="offers" className="py-16 sm:py-24 bg-zinc-950 border-t border-b border-zinc-900 scroll-mt-24 flex flex-col gap-8 sm:gap-12">
        <div className="max-w-7xl mx-auto w-full flex flex-col gap-8 sm:gap-12">
          <div className="text-center max-w-2xl mx-auto px-4 sm:px-6">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-black text-brandRed">LIMITED TIME OFFERS</span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-5xl text-white uppercase mt-2">
              SPECIAL CAMPAIGNS
            </h2>
          </div>
          <OffersCarousel />
        </div>
      </section>

      <section id="testimonials" className="py-16 sm:py-24 bg-zinc-900/10 border-t border-zinc-900 scroll-mt-24">
        <div className="w-full">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 px-4 sm:px-6">
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] font-black text-brandRed">THE PROOF</span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-5xl text-white uppercase mt-2">
              REAL RESULTS
            </h2>
          </div>
          <ReviewsMarquee />
        </div>
      </section>

      <section className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden border-t border-zinc-900 text-center">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-brandRed/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] font-black text-brandRed">GET STARTED</span>
          <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white uppercase tracking-tight leading-none">
            START YOUR FITNESS <br />JOURNEY TODAY
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm md:text-base max-w-md font-light leading-relaxed">
            Join AN Fitness now to get access to top-quality gym facilities, professional training, and a supportive community.
          </p>
          <div className="mt-3 sm:mt-4">
            <Link href="#offers">
              <RainbowButton as="span" className="px-8 sm:px-10 py-3 sm:py-4 text-xs sm:text-base font-bold tracking-widest shadow-2xl">
                JOIN AN FITNESS NOW
              </RainbowButton>
            </Link>
          </div>
        </div>
      </section>

      <section id="location" className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-zinc-950 border-t border-zinc-900 relative">
        <div className="max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[9px] sm:text-[10px] text-brandRed font-black uppercase tracking-[0.3em] font-mono bg-brandRed/10 px-3 py-1 rounded self-start">
                VISIT THE ARENA
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-tight text-white">
                FIND AN FITNESS IN KHORDHA
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-xl font-light">
                Conveniently located on Palla Main Road, Khordha. Drop in for a workout session or speak with our certified coaches.
              </p>
            </div>
            <a
              href="https://maps.app.goo.gl/u3QoCsbmTL7Q6awK6"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-brandRed text-white px-5 py-3 rounded-full text-xs font-mono uppercase tracking-widest transition-all duration-300 group shadow-lg shrink-0"
            >
              <Navigation size={14} className="text-brandRed group-hover:rotate-45 transition-transform" />
              GET DIRECTIONS ON GOOGLE MAPS
            </a>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 w-full h-[320px] sm:h-[420px] rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-900">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4832.664209148892!2d85.60669497611443!3d20.167694416793715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19ad001a4f67d1%3A0x97d65eb0fb90f075!2sAN%20Fitness!5e1!3m2!1sen!2sin!4v1784461815057!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                className="w-full h-full grayscale opacity-85 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                title="AN Fitness Location Map Landing"
              />
            </div>

            <div className="flex flex-col gap-4 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl sm:rounded-3xl p-6 justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brandRed/10 border border-brandRed/20 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-brandRed" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">FACILITY ADDRESS</span>
                    <span className="text-sm font-bold text-white mt-0.5">Palla Main Road, Palla, Khordha, Odisha 752056</span>
                  </div>
                </div>

                <div className="border-t border-zinc-800/60 pt-4 flex flex-col gap-3">
                  <span className="text-[10px] font-mono text-brandRed uppercase font-black tracking-widest">WORKOUT HOURS</span>
                  <div className="flex justify-between text-xs border-b border-zinc-800/40 pb-2">
                    <span className="text-zinc-400">Monday - Saturday:</span>
                    <span className="font-mono text-white text-right">5:00 AM - 12:00 PM<br />4:00 PM - 10:30 PM</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1">
                    <span className="text-zinc-400">Sunday:</span>
                    <span className="font-mono text-brandRed font-bold">6:00 AM - 10:00 AM</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-800/60 pt-4">
                <Link href="/contact" className="w-full flex items-center justify-center gap-2 bg-brandRed hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors shadow-lg shadow-brandRed/20">
                  CONTACT GYM DESK
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 border-t border-zinc-900 py-8 sm:py-12 px-4 sm:px-6 md:px-12 text-zinc-500 text-[10px] sm:text-xs md:text-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="font-heading font-black tracking-widest text-white uppercase text-sm sm:text-base">AN FITNESS</span>
              <a
                href="https://maps.app.goo.gl/u3QoCsbmTL7Q6awK6"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brandRed transition-colors text-center md:text-left"
              >
                Palla Main Road, Palla, Khordha, 752056
              </a>
              <div className="text-zinc-600 text-[9px] sm:text-[10px] uppercase font-mono mt-1 text-center md:text-left leading-relaxed">
                <span className="text-zinc-500 font-bold block mb-0.5">OPENING HOURS</span>
                Mon - Sat: 5:00 AM - 12:00 PM, 4:00 PM - 10:30 PM <br />
                Sun: 6:00 AM - 10:00 AM
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-bold uppercase tracking-wider text-[9px] sm:text-[10px] md:text-xs">
              <Link href="/memberships" className="hover:text-white transition-colors">Memberships</Link>
              <Link href="/gallery" className="hover:text-white transition-colors">Gallery</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
            <div className="text-[9px] sm:text-[10px] text-zinc-600">
              © {new Date().getFullYear()} AN FITNESS. Designed for Athletes. All rights reserved.
            </div>
          </div>

          <div className="w-full text-center mt-8 sm:mt-12 select-none pointer-events-none">
            <span className="font-heading font-black text-[10vw] sm:text-[12vw] leading-none text-white/[0.03] tracking-[0.15em] sm:tracking-[0.2em] uppercase block">
              AN FITNESS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
