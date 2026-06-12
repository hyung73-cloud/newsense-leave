import { useMemo, useState } from 'react';
import { pickRandomWallpaper } from '../data/wallpapers';
import { findByPin, noteSession, type NoteSession } from '../lib/noteSession';
import type { Employee } from '../types';

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

interface PinLoginScreenProps {
  employees: Employee[];
  onLogin: (s: NoteSession) => void;
}

export function PinLoginScreen({ employees, onLogin }: PinLoginScreenProps) {
  const wallpaper = useMemo(() => pickRandomWallpaper(), []);
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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-5">
        {/* 배경 사진 — 중앙(모바일 상단) */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-200/80">
          <div className="relative aspect-[5/3] w-full md:aspect-auto md:min-h-[260px] md:h-full">
            <img
              src={wallpaper}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-4 py-5 text-center text-white md:py-6">
              <p className="text-base font-bold drop-shadow-sm md:text-lg">PIN 입력 후 작성 가능</p>
              <p className="mt-0.5 text-xs text-white/85 drop-shadow-sm md:text-sm">
                아래에서 4자리 PIN을 입력해주세요
              </p>
            </div>
          </div>
        </div>

        {/* 컴팩트 키패드 — 모바일 하단 / PC 오른쪽 */}
        <div className="mx-auto w-full max-w-[220px] shrink-0 md:mx-0 md:flex md:w-[200px] md:flex-col md:justify-center">
          <p className="mb-2 text-center text-xs font-medium text-slate-500">PIN 4자리</p>
          <div className="mb-2 flex justify-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-sm font-bold ${
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
          {error && (
            <p className="mb-1.5 text-center text-xs text-rose-500">PIN이 올바르지 않습니다</p>
          )}
          <div className="grid grid-cols-3 gap-1.5">
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
      </div>
    </div>
  );
}
