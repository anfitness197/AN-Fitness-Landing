"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderLink {
  label: string;
  href: string;
}

interface SectionHeaderProps {
  title: string;
  links?: SectionHeaderLink[];
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, links = [] }) => {
  const [activeAnchor, setActiveAnchor] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScrollState = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScrollState);
    handleScrollState();
    return () => window.removeEventListener("scroll", handleScrollState);
  }, []);

  useEffect(() => {
    if (links.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const link of links) {
        const id = link.href.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveAnchor(link.href);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [links]);

  return (
    <div
      className={cn(
        "sticky z-40 w-full py-2.5 sm:py-3 px-3 sm:px-4 md:px-12 flex flex-row items-center justify-between gap-3 sm:gap-4 transition-all duration-300",
        isScrolled
          ? "bg-zinc-950/85 backdrop-blur-md border-b border-zinc-900/80 opacity-100 pointer-events-auto"
          : "bg-transparent border-transparent opacity-0 pointer-events-none"
      )}
      style={{ top: "72px" }}
    >
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span className="w-1 h-4 bg-brandRed rounded-full animate-pulse" />
        <h2 className="font-heading font-black text-xs md:text-sm tracking-[0.15em] text-white uppercase">
          {title}
        </h2>
      </div>

      {links.length > 0 && (
        <nav className="flex items-center justify-center sm:justify-end gap-3 sm:gap-6 md:gap-8 overflow-x-auto w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "text-[9px] sm:text-[10px] md:text-xs font-bold tracking-wider sm:tracking-widest uppercase transition-all whitespace-nowrap pb-1 border-b-2",
                activeAnchor === link.href
                  ? "text-brandRed border-brandRed font-black"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
};

export default SectionHeader;
