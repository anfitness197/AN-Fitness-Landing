"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Preloader } from "./preloader";
import Navbar from "./navbar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPageReady, setIsPageReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkPageReady = useCallback(() => {
    const fontsReady = document.fonts.status === "loaded";
    const documentReady = document.readyState === "complete" || document.readyState === "interactive";

    if (fontsReady && documentReady) {
      setIsPageReady(true);
    }
  }, []);

  useEffect(() => {
    checkPageReady();

    const onLoad = () => checkPageReady();
    const onFontsLoaded = () => checkPageReady();

    window.addEventListener("load", onLoad);
    document.fonts.ready.then(onFontsLoaded);

    const readyCheckInterval = setInterval(() => {
      checkPageReady();
    }, 200);

    const forceReady = setTimeout(() => {
      setIsPageReady(true);
    }, 3000);

    return () => {
      window.removeEventListener("load", onLoad);
      clearInterval(readyCheckInterval);
      clearTimeout(forceReady);
    };
  }, [pathname, checkPageReady]);

  useEffect(() => {
    const getCleanPathname = (url: string) => {
      try {
        const parsed = new URL(url, "http://dummy.com");
        return parsed.pathname;
      } catch {
        return url.split("?")[0].split("#")[0];
      }
    };

    const handleLinkClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;

      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (target && target.tagName === "A") {
        const href = target.getAttribute("href");

        if (target.getAttribute("target") === "_blank") return;
        if (target.hasAttribute("download")) return;
        if (href && (href.startsWith("mailto:") || href.startsWith("tel:"))) return;

        if (href && href.startsWith("/") && !href.startsWith("#")) {
          const targetPathname = getCleanPathname(href);

          if (targetPathname !== pathname) {
            setIsPageReady(false);
            setLoading(true);
          }
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [pathname]);

  useEffect(() => {
    if (loading) {
      setIsExiting(false);
      document.documentElement.classList.remove("preloader-done", "preloader-exit-start");
      const safetyTimer = setTimeout(() => {
        setLoading(false);
        setIsPageReady(true);
        document.documentElement.classList.add("preloader-done");
        window.dispatchEvent(new CustomEvent("preloader-done"));
      }, 6000);
      return () => clearTimeout(safetyTimer);
    }
  }, [loading]);

  useEffect(() => {
    if (mounted && loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [loading, mounted]);

  const isAdminRoute = pathname?.startsWith("/an-admin");
  const showPreloader = !isAdminRoute && (!mounted || loading);
  const hideContent = !isAdminRoute && (!mounted || (loading && !isExiting));

  return (
    <>
      {showPreloader && (
        <Preloader
          isPageReady={mounted ? isPageReady : false}
          onExitStart={() => setIsExiting(true)}
          onComplete={() => {
            setLoading(false);
            document.documentElement.classList.add("preloader-done");
            window.dispatchEvent(new CustomEvent("preloader-done"));
          }}
        />
      )}
      {!isAdminRoute && mounted && <Navbar />}
      <main
        className={isAdminRoute ? "" : "pt-[72px]"}
        style={{
          visibility: hideContent ? "hidden" : "visible",
        }}
      >
        {children}
      </main>
    </>
  );
};

export default LayoutWrapper;
