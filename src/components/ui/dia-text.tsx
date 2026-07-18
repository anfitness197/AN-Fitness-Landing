"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DiaTextRevealProps {
  text: string;
  colors?: string[];
  duration?: number;
  delay?: number;
  repeat?: boolean;
  repeatDelay?: number;
  className?: string;
}

export const DiaTextReveal: React.FC<DiaTextRevealProps> = ({
  text,
  delay = 0.1,
  className,
}) => {
  const chars = text.split("");

  return (
    <span className={cn("inline-flex justify-center select-none overflow-hidden py-2", className)}>
      {chars.map((char, i) => {
        const charDelay = delay + i * 0.04;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: "80%", filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.6,
              delay: charDelay,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="inline-block whitespace-pre text-brandRed font-heading font-black"
          >
            {char}
          </motion.span>
        );
      })}
    </span>
  );
};

export default DiaTextReveal;
