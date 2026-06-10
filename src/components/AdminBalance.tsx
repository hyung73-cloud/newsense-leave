import { useState } from 'react';
import { countType, decompose, ROLE_OPTIONS, usedUnits } from '../lib/leave';
import type { Employee, LeaveRequest } from '../types';
import { Badge } from './Badge';

interface AdminBalanceProps {
  employees: Employee[];
  requests: LeaveRequest[];
  updateEmployees: (fn: (prev: Employee[]) => Employee[]) => void;
}

export function AdminBalance({ employees, requests, updateEmployees }: AdminBalanceProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [days, setDays] = useState(15);

  const rows = employees
    .filter((e) => e.isActive)
    .map((e) => {
      const granted = e.annualDays * 8;
      const used = usedUnits(e.id, requests);
      const rem = decompose(granted - used);
      const usedAnnual = countType(e.id, 'annual', requests);
      const usedHalf =
        countType(e.id, 'half_am', requests) + countType(e.id, 'half_pm', requests);
      const usedHourly = countType(e.id, 'hourly', requests);
      const pending = requests.filter(
        (r) => r.employeeId === e.id && r.status === 'requested',
      ).length;
      return { e, rem, usedAnnual, usedHalf, usedHourly, pending, over: granted - used < 0 };
    });

  const addEmp = () => {
    if (!name.trim()) return;
    updateEmployees((prev) => [
      ...prev,
      {
        id: 'e' + Date.now(),
        name: name.trim(),
        role,
        isJapaneseAvailable: false,
        isActive: true,
        annualDays: Number(days),
      },
    ]);
    setName('');
  };

  const setDaysFor = (id: string, v: string) =>
    updateEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, annualDays: Math.max(0, Number(v)) } : e)),
    );

  const deactivate = (id: string) =>
    updateEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: false } : e)),
    );

  const downloadCSV = () => {
    const head = [
      '직원명',
      '역할',
      '부여연차(일)',
      '사용연차',
      '사용반차',
      '사용시간차',
      '남은연차',
      '남은반차',
      '남은시간차',
      '승인대기',
    ];
    const body = rows.map((r) => [
      r.e.name,
      r.e.role,
      r.e.annualDays,
      r.usedAnnual,
      r.usedHalf,
      r.usedHourly,
      r.rem.annual,
      r.rem.half,
      r.rem.hourly,
      r.pending,
    ]);
    const csv = '\uFEFF' + [head, ...body].map((x) => x.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '연차잔여.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">직원 잔여현황</h2>
        <button
          type="button"
          onClick={downloadCSV}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th className="px-3 py-2.5 font-medium">직원</th>
              <th className="px-2 py-2.5 font-medium">부여(일)</th>
              <th className="px-2 py-2.5 font-medium">사용(연/반/시)</th>
              <th className="px-2 py-2.5 font-medium text-slate-700">남은 잔여</th>
              <th className="px-2 py-2.5 font-medium">대기</th>
              <th className="px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.e.id} className="border-b border-slate-100">
                <td className="px-3 py-2.5 font-medium text-slate-700">
                  {r.e.name}
                  <div className="text-xs text-slate-400">
                    {r.e.role}
                    {r.e.isJapaneseAvailable ? ' · 🇯🇵' : ''}
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <input
                    type="number"
                    min={0}
                    value={r.e.annualDays}
                    onChange={(e) => setDaysFor(r.e.id, e.target.value)}
                    className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm"
                  />
                </td>
                <td className="px-2 py-2.5 text-slate-500">
                  {r.usedAnnual} / {r.usedHalf} / {r.usedHourly}
                </td>
                <td className="px-2 py-2.5">
                  {r.over ? (
                    <Badge cls="bg-rose-100 text-rose-700">초과</Badge>
                  ) : (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="text-red-600">연차 {r.rem.annual}</span>
                      <span className="text-orange-600">반차 {r.rem.half}</span>
                      <span className="text-yellow-700">시간 {r.rem.hourly}</span>
                    </span>
                  )}
                </td>
                <td className="px-2 py-2.5">
                  {r.pending ? (
                    <Badge cls="bg-amber-100 text-amber-800">{r.pending}</Badge>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-2 py-2.5">
                  <button
                    type="button"
                    onClick={() => deactivate(r.e.id)}
                    className="text-xs text-slate-300 hover:text-rose-500"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">직원명</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">역할</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">부여 연차</label>
          <input
            type="number"
            min={0}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-right text-sm"
          />
        </div>
        <button
          type="button"
          onClick={addEmp}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          추가
        </button>
      </div>
    </div>
  );
}
