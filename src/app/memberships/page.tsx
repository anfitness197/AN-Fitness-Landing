"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Check, Loader2 } from "lucide-react";
import { RainbowButton } from "@/components/ui/rainbow-button";

interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  billing: string;
  features: string | string[];
  popular: number;
  badge: string;
}

const WHATSAPP_NUMBER = "919867195346";

function getWhatsappUrl(planName: string, planPrice: number) {
  const text = `Hi AN Fitness, I'm interested in the ${planName} membership plan (₹${planPrice}). Please assist me with registration!`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function MembershipsPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMemberships() {
      try {
        const res = await fetch("/api/memberships");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const formattedPlans = data.map((plan: any) => {
            let parsedFeatures: string[] = [];
            try {
              if (Array.isArray(plan.features)) {
                parsedFeatures = plan.features;
              } else if (typeof plan.features === "string") {
                parsedFeatures = JSON.parse(plan.features);
              }
            } catch (e) {
              if (typeof plan.features === "string") {
                parsedFeatures = plan.features.split("\n").map((f: string) => f.trim()).filter(Boolean);
              }
            }
            return {
              ...plan,
              features: parsedFeatures,
            };
          });
          setPlans(formattedPlans);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error("Failed to load memberships:", err);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    }
    loadMemberships();
  }, []);

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col justify-between overflow-x-hidden text-white pt-20 sm:pt-24 pb-12 sm:pb-16">
      {plans.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "AN Fitness Membership Plans",
              "description": "Affordable gym memberships with full access to strength decks, personal coaching, and premium facilities.",
              "itemListElement": plans.map((plan, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": `${plan.name} Membership`,
                  "description": `AN Fitness ${plan.name} membership plan. Features include: ${Array.isArray(plan.features) ? plan.features.join(", ") : plan.features}`,
                  "offers": {
                    "@type": "Offer",
                    "price": plan.price,
                    "priceCurrency": "INR",
                    "valueAddedTaxIncluded": true,
                    "priceSpecification": {
                      "@type": "UnitPriceSpecification",
                      "price": plan.price,
                      "priceCurrency": "INR",
                      "referenceQuantity": {
                        "@type": "QuantitativeValue",
                        "value": 1,
                        "unitText": plan.billing.toLowerCase().includes("month") ? "MON" : "ANN"
                      }
                    }
                  }
                }
              }))
            })
          }}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] h-[200px] sm:h-[300px] bg-brandRed/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 flex-1 flex flex-col gap-6 sm:gap-10">
        <div className="self-start">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] sm:text-xs font-mono uppercase tracking-widest">
            <ChevronLeft size={14} />
            BACK TO DECK
          </Link>
        </div>

        <div className="text-left flex flex-col gap-2 sm:gap-3">
          <span className="text-[9px] sm:text-[10px] text-brandRed font-mono font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] bg-brandRed/10 px-3 py-1 rounded self-start">
            PRICING TIER
          </span>
          <h1 className="font-heading font-black text-3xl sm:text-4xl md:text-6xl text-white uppercase tracking-tight leading-none">
            MEMBERSHIP PLANS
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm md:text-base max-w-xl font-light">
            Choose your contract length and access permissions. No signup fees, no hidden lock-ins. Forge your steel with us.
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
            <Loader2 size={28} className="animate-spin text-brandRed" />
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-mono text-zinc-600">Retrieving Pricing Tiers...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-stretch mt-4 sm:mt-6">
            {plans.map((plan) => {
              const featuresList = Array.isArray(plan.features) ? plan.features : [];

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 transition-all duration-300 shadow-2xl flex flex-col justify-between ${
                    plan.popular
                      ? "border-2 border-brandRed bg-zinc-900/15 shadow-[0_0_30px_rgba(214,26,31,0.15)] bg-gradient-to-b from-brandRed/5 to-transparent scale-[1.01] sm:scale-[1.02]"
                      : "border border-zinc-900 bg-zinc-900/10 bg-gradient-to-b from-zinc-900/30 to-transparent hover:border-zinc-800"
                  }`}
                >
                  {plan.popular === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brandRed text-white text-[8px] sm:text-[9px] font-mono font-black tracking-widest px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase shadow-md shadow-brandRed/20">
                      {plan.badge || "MOST POPULAR"}
                    </div>
                  )}

                  <div>
                    <h3 className="font-heading font-black text-lg sm:text-xl md:text-2xl text-white uppercase tracking-tight leading-none mb-1">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-4 sm:mb-6">
                      <span className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-brandRed">₹{plan.price}</span>
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest font-mono">{plan.billing}</span>
                    </div>

                    <div className="w-12 h-[2px] bg-brandRed/60 mb-4 sm:mb-6" />

                    <ul className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
                      {featuresList.map((feat, fidx) => (
                        <li key={fidx} className="flex items-start gap-2.5 sm:gap-3.5 text-zinc-300 text-[11px] sm:text-xs md:text-sm font-light leading-relaxed">
                          <Check size={14} className="text-brandRed shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 sm:mt-8">
                    <a
                      href={getWhatsappUrl(plan.name, plan.price)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full flex items-center justify-center gap-2 border hover:border-white px-4 py-3 sm:py-4 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase transition-all duration-300 shadow-lg text-center cursor-pointer ${
                        plan.popular
                          ? "bg-brandRed border-brandRed hover:bg-transparent text-white"
                          : "bg-brandRed/5 border-brandRed hover:bg-brandRed text-white"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      CLAIM VIA WHATSAPP
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 sm:mt-16 bg-zinc-900/10 border border-zinc-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 backdrop-blur-sm">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h3 className="font-heading font-black text-base sm:text-lg text-white uppercase tracking-wider">WANT A CUSTOM PLAN?</h3>
            <p className="text-zinc-500 text-[10px] sm:text-xs font-mono uppercase tracking-widest">For corporate packages or high-performance personal training</p>
          </div>
          <Link href="/contact">
            <RainbowButton className="px-6 sm:px-8 py-3 sm:py-3.5 text-[10px] sm:text-xs font-black tracking-widest uppercase">
              CONTACT OUR DESK
            </RainbowButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
