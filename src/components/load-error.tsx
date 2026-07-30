export function LoadError({
  message = "Something went wrong. Please try again.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-16 sm:py-20 text-center border border-brandRed/20 rounded-2xl sm:rounded-3xl bg-brandRed/5 gap-3 px-4">
      <p className="text-sm text-zinc-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 px-5 py-2.5 rounded-full bg-brandRed hover:bg-brandRed-light text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}
