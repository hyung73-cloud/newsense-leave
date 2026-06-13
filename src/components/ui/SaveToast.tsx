interface SaveToastProps {
  message: string;
}

export function SaveToast({ message }: SaveToastProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
        ✓
      </span>
      <p className="text-sm font-medium text-emerald-800">{message}</p>
    </div>
  );
}
