"use client";

import React, { useState, useEffect } from "react";
import { DiaTextReveal } from "./ui/dia-text";

const WORDS = ["STRENGTH", "POWER", "RESULTS", "FOCUS"];

export function HeroHeadline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORDS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="font-heading font-black text-[13vw] xs:text-6xl sm:text-8xl md:text-[120px] lg:text-[150px] tracking-tight leading-none text-white uppercase select-none">
      <span className="sr-only">AN Fitness - Training Club | </span>
      DEMAND <br />
      <DiaTextReveal key={WORDS[index]} text={WORDS[index]} duration={1.5} delay={0.1} />
    </h1>
  );
}

export default HeroHeadline;
