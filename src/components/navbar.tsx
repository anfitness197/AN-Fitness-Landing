"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { RainbowButton } from "./ui/rainbow-button";

interface NavItem {
  heading: string;
  href: string;
  subheading: string;
}

const MENU_SLIDE_ANIMATION: Variants = {
  initial: { x: "calc(100% + 100px)" },
  enter: { x: "0", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] } },
  exit: {
    x: "calc(100% + 100px)",
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
  },
};

const navItems: NavItem[] = [
  {
    heading: "Home",
    href: "/",
    subheading: "Welcome to AN Fitness",
  },
  {
    heading: "Memberships",
    href: "/memberships",
    subheading: "Choose your plan",
  },
  {
    heading: "Gallery",
    href: "/gallery",
    subheading: "View our facilities",
  },
  {
    heading: "Events",
    href: "/events",
    subheading: "Workshops & notices",
  },
  {
    heading: "Contact",
    href: "/contact",
    subheading: "Get in touch",
  },
];

const CustomFooter: React.FC = () => {
  return (
    <div className="flex w-full text-zinc-400 justify-center items-center py-8 border-t border-zinc-800 bg-black">
      <a
        href="https://instagram.com/an_fitness2025"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:text-red-500 transition-colors group font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em]"
      >
        <Instagram size={18} className="group-hover:scale-110 transition-transform" />
        <span>@an_fitness2025</span>
      </a>
    </div>
  );
};

interface NavLinkProps extends NavItem {
  setIsActive: (isActive: boolean) => void;
  index: number;
  isActivePage: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({
  heading,
  href,
  setIsActive,
  index,
  isActivePage,
}) => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleClick = () => {
    setIsActive(false);
  };

  return (
    <motion.div
      onClick={handleClick}
      initial="initial"
      whileHover="whileHover"
      className="group relative flex items-center justify-between border-b border-zinc-800/80 py-4 transition-colors duration-500 md:py-6 uppercase"
    >
      <Link ref={ref} onMouseMove={handleMouseMove} href={href} className="w-full flex items-center justify-between">
        <div className="relative flex items-center">
          <span className="text-zinc-600 transition-colors duration-500 group-hover:text-red-500 text-xl sm:text-2xl font-light mr-3 sm:mr-4 font-mono">
            0{index}.
          </span>
          <div className="flex flex-col">
            <motion.span
              variants={{
                initial: { x: 0 },
                whileHover: { x: 8 },
              }}
              transition={{
                type: "spring",
                stiffness: 150,
                damping: 15,
              }}
              className={cn(
                "relative z-10 block text-2xl sm:text-3xl md:text-4xl font-black transition-colors duration-300",
                isActivePage ? "text-red-500" : "text-white group-hover:text-red-500"
              )}
            >
              {heading}
            </motion.span>
          </div>
        </div>

        {isActivePage && (
          <motion.div
            layoutId="activeIndicator"
            className="w-2.5 h-2.5 bg-red-600 rounded-full mr-2"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </Link>
    </motion.div>
  );
};

const Curve: React.FC = () => {
  const [windowHeight, setWindowHeight] = useState(1080);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowHeight(window.innerHeight);
    }
  }, []);

  const initialPath = `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q-100 ${windowHeight / 2} 100 0`;
  const targetPath = `M100 0 L200 0 L200 ${windowHeight} L100 ${windowHeight} Q100 ${windowHeight / 2} 100 0`;

  const curve: Variants = {
    initial: { d: initialPath },
    enter: {
      d: targetPath,
      transition: { duration: 1, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
    },
    exit: {
      d: initialPath,
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
    },
  };

  return (
    <svg
      className="absolute top-0 -left-[99px] w-[100px] stroke-none h-full"
      style={{ fill: "#0a0a0a" }}
    >
      <motion.path
        variants={curve}
        initial="initial"
        animate="enter"
        exit="exit"
      />
    </svg>
  );
};

interface CurvedNavbarProps {
  setIsActive: (isActive: boolean) => void;
  activePath: string;
}

const CurvedNavbar: React.FC<CurvedNavbarProps> = ({ setIsActive, activePath }) => {
  return (
    <motion.div
      variants={MENU_SLIDE_ANIMATION}
      initial="initial"
      animate="enter"
      exit="exit"
      className="h-[100dvh] w-screen max-w-[min(100vw,640px)] fixed right-0 top-0 z-[100] bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
    >
      <div className="h-full pt-20 flex flex-col justify-between">
        <div className="flex flex-col gap-4 px-6 sm:px-10 md:px-24">
          <div className="text-zinc-500 border-b border-zinc-800 pb-2 uppercase text-xs tracking-[0.3em] mb-4">
            <p>Navigation</p>
          </div>
          <section className="bg-transparent">
            <div className="mx-auto max-w-7xl flex flex-col gap-1">
              {navItems.map((item, index) => {
                return (
                  <NavLink
                    key={item.href}
                    {...item}
                    setIsActive={setIsActive}
                    index={index + 1}
                    isActivePage={activePath === item.href}
                  />
                );
              })}
            </div>
          </section>
        </div>
        <CustomFooter />
      </div>
      <Curve />
    </motion.div>
  );
};

export const Navbar: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 md:px-12 h-[72px] transition-all duration-300",
        isActive ? "z-[120]" : "z-[90]",
        isScrolled
          ? "bg-zinc-950/80 border-b border-zinc-900/50 backdrop-blur-md"
          : "bg-transparent border-transparent backdrop-blur-none"
      )}>
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">

            <img
              src="/assets/logos/favicon.svg"
              alt="AN Fitness Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(214,26,31,0.5)]"
            />
          </div>
          <span className="font-black text-sm sm:text-base md:text-lg tracking-[0.15em] sm:tracking-[0.2em] text-white uppercase group-hover:text-red-500 transition-colors">
            AN FITNESS
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <Link
            href="/events"
            className="relative p-2 sm:p-2.5 rounded-full bg-zinc-900/90 border border-zinc-800 hover:border-red-600 hover:bg-zinc-900 text-zinc-300 transition-all flex items-center justify-center group cursor-pointer"
            title="Latest Notifications & Events"
            aria-label="View Latest Notifications & Events"
          >
            <Bell size={18} className="group-hover:scale-110 transition-transform text-zinc-300 group-hover:text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-600 border border-zinc-950" />
          </Link>

          <Link href="/#offers">
            <RainbowButton as="span" className="px-3 py-1.5 sm:px-4 md:px-6 md:py-2 text-[9px] sm:text-[10px] md:text-xs">
              Join Now
            </RainbowButton>
          </Link>

          <button
            onClick={handleClick}
            className={cn(
              "relative z-[110] w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer border border-zinc-800 transition-colors hover:border-red-600",
              isActive ? "bg-red-600 border-transparent text-white" : "bg-zinc-900 text-zinc-100"
            )}
            aria-label="Toggle Navigation Menu"
          >
            <div className="relative w-4 h-3.5 sm:w-5 sm:h-4 flex flex-col justify-between items-center">
              <span
                className={cn(
                  "block h-[2px] w-full bg-current transition-transform duration-300 origin-center",
                  isActive ? "rotate-45 translate-y-[6px] sm:translate-y-[7px]" : ""
                )}
              />
              <span
                className={cn(
                  "block h-[2px] w-full bg-current transition-opacity duration-300",
                  isActive ? "opacity-0" : ""
                )}
              />
              <span
                className={cn(
                  "block h-[2px] w-full bg-current transition-transform duration-300 origin-center",
                  isActive ? "-rotate-45 -translate-y-[6px] sm:-translate-y-[7px]" : ""
                )}
              />
            </div>
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {isActive && (
          <CurvedNavbar
            setIsActive={setIsActive}
            activePath={pathname}
          />
        )}
      </AnimatePresence>
    </>
  );
};
export default Navbar;
