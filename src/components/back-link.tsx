import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink({ href = "/", label = "Back to home" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs sm:text-sm"
    >
      <ChevronLeft size={14} />
      {label}
    </Link>
  );
}
