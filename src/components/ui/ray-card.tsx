"use client";

import React, { useState } from "react";

interface RayCardProps {
  title: string;
  value: string;
  subtitle: string;
  description: string;
  badge?: string;
  code?: string;
  children?: React.ReactNode;
}

export const RayCard: React.FC<RayCardProps> = ({
  title,
  value,
  subtitle,
  description,
  badge,
  code,
  children
}) => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      className="group relative overflow-hidden p-[1.5px] bg-zinc-900/60 hover:bg-zinc-800/80 hover:animate-border-glow rounded-2xl transition-all duration-300 w-full flex"
      onMouseMove={handleMouseMove}
    >
      <div
        className="absolute w-48 h-48 bg-brandRed rounded-full opacity-0 group-hover:opacity-20 blur-[50px] pointer-events-none transition-opacity duration-300 z-0"
        style={{
          left: `${coords.x - 96}px`,
          top: `${coords.y - 96}px`,
        }}
      />

      <div className="relative z-10 w-full bg-zinc-950 p-5 sm:p-6 md:p-8 rounded-2xl flex flex-col justify-between overflow-hidden border border-zinc-900/80">
        <div className="absolute inset-0 bg-gradient-to-br from-brandRed/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <div className="relative z-20 flex flex-col gap-3 sm:gap-4 w-full">
          {badge && (
            <div className="inline-block self-start px-2 py-0.5 bg-brandRed text-white text-[8px] sm:text-[9px] uppercase tracking-widest font-black rounded">
              {badge}
            </div>
          )}
          <div className="flex flex-col">
            <h3 className="font-heading font-black text-[10px] sm:text-xs md:text-sm text-zinc-500 uppercase tracking-widest">
              {title}
            </h3>
            <span className="font-heading font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white tracking-tight mt-1">
              {value}
            </span>
          </div>
          <p className="text-zinc-300 text-xs sm:text-sm md:text-base font-bold uppercase tracking-wider leading-snug">
            {subtitle}
          </p>
          {description && (
            <p className="text-zinc-500 text-[10px] sm:text-xs md:text-sm font-light leading-relaxed">
              {description}
            </p>
          )}
          {code && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Use Code:</span>
              <span className="px-2 py-1 bg-zinc-900 border border-zinc-800 text-brandRed font-mono font-black rounded text-[10px] sm:text-xs select-all">
                {code}
              </span>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default RayCard;
