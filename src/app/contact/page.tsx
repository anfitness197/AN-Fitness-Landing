import React from "react";
import { Metadata } from "next";
import { MapPin, Phone } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { WHATSAPP_DISPLAY, WHATSAPP_URL, MAPS_URL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with AN Fitness in Khordha. Contact us via WhatsApp for gym memberships, personal training inquiries, and facility information.",
  openGraph: {
    title: "Contact Us | AN Fitness",
    description:
      "Get in touch with AN Fitness in Khordha. Contact us via WhatsApp for gym memberships, personal training inquiries, and facility information.",
  },
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col overflow-x-hidden text-white pt-20 sm:pt-24 pb-12 sm:pb-16">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-brandRed/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto w-full px-4 sm:px-6 flex flex-col gap-8 sm:gap-10">
        <div className="self-start">
          <BackLink />
        </div>

        <div className="flex flex-col items-center text-center gap-6 sm:gap-8 max-w-lg mx-auto w-full">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 fill-green-500" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] sm:text-xs text-brandRed font-black uppercase tracking-[0.3em] font-mono">
              Get in touch
            </span>
            <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-tight leading-none">
              Contact via WhatsApp
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed max-w-sm mx-auto mt-2">
              Reach out to us directly on WhatsApp for membership inquiries, personal training bookings, or any questions about our gym.
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-zinc-300">
            <Phone size={16} className="text-green-500" />
            <span className="font-mono text-lg sm:text-xl font-bold tracking-wider">{WHATSAPP_DISPLAY}</span>
          </div>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full text-xs sm:text-sm font-black tracking-widest uppercase transition-all duration-300 shadow-lg shadow-green-600/20 hover:shadow-green-500/30"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Open WhatsApp chat
          </a>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch border-t border-zinc-900 pt-8 mt-2">
          <div className="flex flex-col gap-4">
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest group bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-4"
            >
              <MapPin size={16} className="text-brandRed group-hover:scale-110 transition-transform shrink-0" />
              <span>Palla Main Road, Palla, Khordha, 752056</span>
            </a>

            <div className="w-full flex flex-col items-start gap-2 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 flex-1">
              <span className="text-[11px] text-brandRed font-black uppercase tracking-[0.3em] font-mono mb-1">
                Opening hours
              </span>
              <div className="w-full flex flex-col gap-3 text-zinc-400 text-xs font-light">
                <div className="flex justify-between border-b border-zinc-800/50 pb-2">
                  <span className="font-semibold text-zinc-300">Mon - Sat:</span>
                  <span className="font-mono text-right">
                    5:00 AM - 12:00 PM <br />
                    4:00 PM - 10:30 PM
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="font-semibold text-zinc-300">Sunday:</span>
                  <span className="font-mono text-right text-brandRed font-bold">
                    6:00 AM - 10:00 AM
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full min-h-[280px] sm:min-h-[320px] h-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative bg-zinc-900">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4832.664209148892!2d85.60669497611443!3d20.167694416793715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a19ad001a4f67d1%3A0x97d65eb0fb90f075!2sAN%20Fitness!5e1!3m2!1sen!2sin!4v1784461815057!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 280 }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="w-full h-full min-h-[280px] sm:min-h-[320px] border-0"
              title="AN Fitness Location Map"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
