import { useState } from 'react';
import type { Employee } from '../types';

interface AdminPinPanelProps {
  employees: Employee[];
  updateEmployees: (fn: (prev: Employee[]) => Employee[]) => void;
}

export function AdminPinPanel({ employees, updateEmployees }: AdminPinPanelProps) {
  const actives = employees.filter((e) => e.isActive);
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(actives.map((e) => [e.id, e.pin])),
  );
  const [msg, setMsg] = useState('');

  const setDraft = (id: string, v: string) => {
    setDrafts((prev) => ({ ...prev, [id]: v.replace(/\D/g, '').slice(0, 4) }));
    setMsg('');
  };

  const savePin = (id: string) => {
    const pin = (drafts[id] ?? '').replace(/\D/g, '').slice(0, 4);
    if (pin.length !== 4) {
      setMsg('PIN은 4자리 숫자여야 합니다.');
      return;
    }
    if (actives.some((e) => e.id !== id && e.pin === pin)) {
      setMsg('이미 다른 직원이 사용 중인 PIN입니다.');
      return;
    }
    if (actives.some((e) => e.id !== id && (drafts[e.id] ?? e.pin) === pin)) {
      setMsg('입력한 PIN이 다른 직원과 중복됩니다.');
      return;
    }
    updateEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, pin } : e)));
    setMsg(`✓ ${actives.find((e) => e.id === id)?.name} PIN 저장됨`);
    setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">고객노트 PIN 설정</h2>
        <p className="mt-1 text-sm text-slate-500">
          직원별 4자리 PIN을 지정·변경합니다. 고객노트·연차관리(직원) 로그인에 사용됩니다.
        </p>
      </div>

      <ul className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        {actives.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 sm:gap-3"
          >
            <div className="min-w-[72px] font-bold text-slate-800">{e.name}</div>
            <span className="text-xs text-slate-400">{e.role}</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={drafts[e.id] ?? e.pin}
              onChange={(ev) => setDraft(e.id, ev.target.value)}
              className="ml-auto w-24 rounded-lg border border-slate-300 px-2 py-2 text-center text-sm tracking-[0.3em] sm:ml-0"
            />
            <button
              type="button"
              onClick={() => savePin(e.id)}
              disabled={(drafts[e.id] ?? e.pin) === e.pin}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              저장
            </button>
          </li>
        ))}
      </ul>

      {msg && <p className="text-center text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
