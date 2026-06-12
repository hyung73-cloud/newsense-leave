import { useState } from 'react';
import { findByPin, noteSession, type NoteSession } from '../lib/noteSession';
import type { Employee } from '../types';

interface NotePinAuthProps {
  employees: Employee[];
  session: NoteSession | null;
  onLogin: (s: NoteSession) => void;
  onLogout: () => void;
}

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function NotePinAuth({ employees, session, onLogin, onLogout }: NotePinAuthProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const tap = (key: string) => {
    setError(false);
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= 4) return;
    const next = pin + key;
    setPin(next);
    if (next.length === 4) tryLogin(next);
  };

  const tryLogin = (code: string) => {
    const emp = findByPin(employees, code);
    if (!emp) {
      setError(true);
      setPin('');
      return;
    }
    const s = noteSession.save(emp.id, emp.name, emp.pin);
    setPin('');
    setError(false);
    onLogin(s);
  };

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-[#FEE500] px-3 py-2 text-center">
          <div className="text-xs font-medium text-[#3B1E1E]/70">작성자</div>
          <div className="text-sm font-bold text-[#3B1E1E]">{session.employeeName}</div>
        </div>
        <button
          type="button"
          onClick={() => {
            noteSession.clear();
            onLogout();
          }}
          className="rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 active:bg-slate-100"
        >
          PIN<br />변경
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[200px]">
      <div className="mb-1.5 text-right text-xs font-medium text-slate-500">PIN 4자리</div>
      <div className="mb-2 flex justify-end gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-lg font-bold ${
              error
                ? 'border-rose-300 bg-rose-50 text-rose-400'
                : pin[i]
                  ? 'border-[#FEE500] bg-[#FEE500]/20 text-slate-800'
                  : 'border-slate-200 bg-white text-slate-300'
            }`}
          >
            {pin[i] ? '●' : ''}
          </div>
        ))}
      </div>
      {error && <p className="mb-1 text-right text-xs text-rose-500">PIN이 올바르지 않습니다</p>}
      <div className="grid grid-cols-3 gap-1">
        {PAD.map((key, i) =>
          key ? (
            <button
              key={i}
              type="button"
              onClick={() => tap(key)}
              className="flex h-11 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-700 active:bg-[#FEE500] active:text-[#3B1E1E]"
            >
              {key}
            </button>
          ) : (
            <div key={i} />
          ),
        )}
      </div>
    </div>
  );
}
