import { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-20 text-center border border-zinc-900 rounded-2xl sm:rounded-3xl bg-zinc-900/5 gap-2 px-4">
      <h4 className="text-sm sm:text-base font-heading font-bold text-zinc-400 uppercase tracking-wide">
        {title}
      </h4>
      {description && (
        <p className="text-zinc-500 text-xs sm:text-sm font-light max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
