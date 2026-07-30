import { Loader2 } from "lucide-react";

export function PageLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-24 gap-4">
      <Loader2 size={28} className="animate-spin text-brandRed" />
      <span className="text-xs sm:text-sm text-zinc-500">{label}</span>
    </div>
  );
}
