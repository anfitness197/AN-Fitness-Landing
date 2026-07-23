"use client";

import React from "react";
import Link from "next/link";
import FuzzyText from "@/components/ui/fuzzy-text";
import { RainbowButton } from "@/components/ui/rainbow-button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-brandRed/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mb-6 sm:mb-8 animate-bounce [animation-duration:3s]">

        <img
          src="/assets/vectors/dumbbell-iron.svg"
          alt="AN Fitness Dumbbell"
          className="w-16 h-16 sm:w-24 sm:h-24 object-contain filter drop-shadow-[0_0_15px_rgba(214,26,31,0.6)] invert opacity-80 hover:opacity-100 hover:scale-110 transition-all duration-300"
        />
      </div>

      <div className="relative z-10 select-none cursor-default">
        <FuzzyText
          baseIntensity={0.2}
          hoverIntensity={0.5}
          enableHover={true}
          gradient={["#D61A1F", "#FF4D52", "#8A1013"]}
          fontSize="clamp(3rem, 14vw, 12rem)"
          fontWeight={900}
          fuzzRange={25}
          fps={60}
          direction="both"
        >
          404
        </FuzzyText>
      </div>

      <div className="relative z-10 text-center max-w-md mt-4 sm:mt-6 flex flex-col items-center gap-3 sm:gap-4">
        <h1 className="font-heading font-black text-lg sm:text-xl md:text-2xl text-white uppercase tracking-wider">
          LOOKS LIKE YOU OUT-LIFTED THIS ROUTE
        </h1>
        <p className="text-zinc-500 text-[10px] sm:text-xs md:text-sm font-light leading-relaxed">
          The page you are looking for has been moved, removed, Go to Home Page.
        </p>

        <div className="mt-4 sm:mt-6">
          <Link href="/">
            <RainbowButton className="px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              RETURN TO HOME PAGE
            </RainbowButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
