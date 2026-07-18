import React from "react";
import { cn } from "@/lib/utils";

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  as?: React.ElementType;
}

export const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ children, className, as: Component = "button", ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "relative cursor-pointer group transition-all duration-300 active:scale-95",
          "inline-flex items-center justify-center gap-2 shrink-0 px-6 py-3",
          "rounded-full outline-none text-sm font-semibold tracking-wider uppercase text-white",
          "border border-red-500/20 bg-zinc-950 overflow-hidden",
          
          "bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,#D61A1F,#8A1013,#D61A1F,#1E0506,#D61A1F)]",
          "bg-[length:200%] [background-clip:padding-box,border-box,border-box] [background-origin:border-box]",
          "border-transparent animate-rainbow",
          
          "hover:shadow-[0_0_20px_rgba(214,26,31,0.4)] transition-shadow duration-300",
          
          "before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,#D61A1F,#8A1013,#D61A1F,#1E0506,#D61A1F)] before:bg-[length:200%] before:[filter:blur(1rem)] before:opacity-60",
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </Component>
    );
  }
);

RainbowButton.displayName = "RainbowButton";
