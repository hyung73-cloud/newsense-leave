interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = '불러오는 중…',
  className = 'py-16',
}: LoadingStateProps) {
  return (
    <p className={`text-center text-sm text-slate-400 ${className}`}>
      <span className="inline-block animate-pulse">{message}</span>
    </p>
  );
}
