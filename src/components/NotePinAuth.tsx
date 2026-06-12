import { noteSession, type NoteSession } from '../lib/noteSession';

interface NotePinAuthProps {
  session: NoteSession | null;
  onLogout: () => void;
}

export function NotePinAuth({ session, onLogout }: NotePinAuthProps) {
  if (session) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="rounded-xl bg-[#FEE500] px-2.5 py-1.5 text-center sm:px-3 sm:py-2">
          <div className="text-[10px] font-medium text-[#3B1E1E]/70 sm:text-xs">작성자</div>
          <div className="text-xs font-bold text-[#3B1E1E] sm:text-sm">{session.employeeName}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            noteSession.clear();
            onLogout();
          }}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-medium text-slate-500 active:bg-slate-100 sm:text-xs"
        >
          PIN OUT
        </button>
      </div>
    );
  }

  return (
    <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-500">
      PIN 입력
    </span>
  );
}
