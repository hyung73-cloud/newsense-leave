import { useState } from 'react';
import { countType, decompose, ROLE_OPTIONS, usedUnits } from '../lib/leave';
import type { Employee, LeaveRequest } from '../types';
import { Badge } from './Badge';

interface AdminBalanceProps {
  employees: Employee[];
  requests: LeaveRequest[];
  updateEmployees: (fn: (prev: Employee[]) => Employee[]) => void;
  onDeleteEmployee: (id: string) => void;
}

export function AdminBalance({
  employees,
  requests,
  updateEmployees,
  onDeleteEmployee,
}: AdminBalanceProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('직원');
  const [days, setDays] = useState(15);
  const [deleteId, setDeleteId] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('직원');
  const [editDays, setEditDays] = useState(10.5);
  const [editPin, setEditPin] = useState('0000');
  const [addPin, setAddPin] = useState('');

  const actives = employees.filter((e) => e.isActive);

  const rows = actives.map((e) => {
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
    const pin = addPin.replace(/\D/g, '').slice(0, 4);
    if (pin.length !== 4) {
      alert('고객노트 PIN은 4자리 숫자입니다.');
      return;
    }
    if (actives.some((e) => e.pin === pin)) {
      alert('이미 사용 중인 PIN입니다.');
      return;
    }
    updateEmployees((prev) => [
      ...prev,
      {
        id: 'e' + Date.now(),
        name: name.trim(),
        role,
        pin,
        isJapaneseAvailable: false,
        isActive: true,
        annualDays: Number(days),
      },
    ]);
    setName('');
    setAddPin('');
  };

  const setDaysFor = (id: string, v: string) =>
    updateEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, annualDays: Math.max(0, Number(v)) } : e)),
    );

  const removeEmp = (id: string, empName: string) => {
    if (!confirm(`${empName} 직원을 삭제할까요?\n연차 신청 내역도 함께 삭제됩니다.`)) return;
    onDeleteEmployee(id);
    if (deleteId === id) setDeleteId('');
  };

  const removeSelected = () => {
    if (!deleteId) return;
    const emp = actives.find((e) => e.id === deleteId);
    if (emp) removeEmp(deleteId, emp.name);
  };

  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    setEditName(emp.name);
    setEditRole(emp.role);
    setEditDays(emp.annualDays);
    setEditPin(emp.pin);
  };

  const closeEdit = () => setEditId(null);

  const saveEdit = () => {
    if (!editId || !editName.trim()) return;
    const pin = editPin.replace(/\D/g, '').slice(0, 4);
    if (pin.length !== 4) {
      alert('고객노트 PIN은 4자리 숫자입니다.');
      return;
    }
    if (actives.some((e) => e.id !== editId && e.pin === pin)) {
      alert('이미 사용 중인 PIN입니다.');
      return;
    }
    updateEmployees((prev) =>
      prev.map((e) =>
        e.id === editId
          ? {
              ...e,
              name: editName.trim(),
              role: editRole,
              pin,
              annualDays: Math.max(0, Number(editDays)),
            }
          : e,
      ),
    );
    closeEdit();
  };

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
              <th className="px-2 py-2.5 font-medium text-center">관리</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.e.id} className="border-b border-slate-100">
                <td className="px-3 py-2.5 font-medium text-slate-700">
                  {r.e.name}
                  <div className="text-xs text-slate-400">
                    {r.e.role} · PIN {r.e.pin}
                    {r.e.isJapaneseAvailable ? ' · 🇯🇵' : ''}
                  </div>
                </td>
                <td className="px-2 py-2.5">
                  <input
                    type="number"
                    min={0}
                    step={0.5}
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
                <td className="px-2 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(r.e)}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600 hover:bg-sky-100"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => removeEmp(r.e.id, r.e.name)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100"
                    >
                      삭제
                    </button>
                  </div>
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
            step={0.5}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-right text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">노트 PIN</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={addPin}
            onChange={(e) => setAddPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="4자리"
            className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-center text-sm tracking-widest"
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

      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-rose-600">삭제할 직원</label>
          <select
            value={deleteId}
            onChange={(e) => setDeleteId(e.target.value)}
            className="w-full rounded-lg border border-rose-200 bg-white px-2.5 py-2 text-sm"
          >
            <option value="">직원 선택</option>
            {actives.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.role}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={removeSelected}
          disabled={!deleteId}
          className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          삭제
        </button>
      </div>

      {editId && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-slate-800">직원 정보 수정</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">직원명</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">역할</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
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
                  step={0.5}
                  value={editDays}
                  onChange={(e) => setEditDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">고객노트 PIN (4자리)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-center text-sm tracking-widest"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
