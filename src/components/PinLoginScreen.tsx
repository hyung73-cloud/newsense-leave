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
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
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
    <div className="mx-auto flex w-full max-w-lg flex-col md:block">
      {/* 배경 사진 — 모바일에서는 작게, 키패드 공간 확보 */}
      <div className="shrink-0 overflow-hidden rounded-2xl shadow-md ring-1 ring-slate-200/80">
        <div className="relative h-[18vh] min-h-[100px] max-h-[140px] w-full md:aspect-[2/1] md:h-auto md:max-h-none">
          <img
            src={wallpaper}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-4 py-2 text-center text-white md:py-3">
            <p className="text-xs font-bold drop-shadow-sm md:text-base">PIN 입력 후 작성 가능</p>
          </div>
        </div>
      </div>

      {/* 키패드 — 모바일: 하단 고정·큰 터치 영역 / 데스크톱: 일반 배치 */}
      <div className="mt-3 flex flex-1 flex-col rounded-t-3xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 md:mt-4 md:rounded-2xl md:shadow-sm md:pb-4">
        <p className="mb-2 text-center text-sm font-medium text-slate-600 md:mb-3">PIN 4자리 입력</p>
        <div className="mb-3 flex justify-center gap-3 md:mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-bold md:h-14 md:w-14 md:text-xl ${
                error
                  ? 'border-rose-300 bg-rose-50 text-rose-400'
                  : pin[i]
                    ? 'border-[#FEE500] bg-[#FEE500]/25 text-slate-800'
                    : 'border-slate-200 bg-slate-50 text-slate-300'
              }`}
            >
              {pin[i] ? '●' : ''}
            </div>
          ))}
        </div>
        {error && (
          <p className="mb-2 text-center text-sm text-rose-500 md:mb-3">PIN이 올바르지 않습니다</p>
        )}
        <div className="grid flex-1 grid-cols-3 gap-3 md:gap-2.5">
          {PAD.map((key, i) =>
            key ? (
              <button
                key={i}
                type="button"
                onClick={() => tap(key)}
                className="flex min-h-[4.25rem] touch-manipulation select-none items-center justify-center rounded-2xl bg-slate-100 text-3xl font-bold text-slate-800 [-webkit-tap-highlight-color:transparent] active:scale-[0.97] active:bg-[#FEE500] active:text-[#3B1E1E] md:min-h-0 md:h-14 md:text-xl"
              >
                {key}
              </button>
            ) : (
              <div key={i} className="min-h-[4.25rem] md:min-h-0 md:h-14" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
