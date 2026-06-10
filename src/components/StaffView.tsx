import { useMemo, useState } from 'react';
import { DAY_UNITS, decompose, REQ_STATUS, TYPE_ORDER, TYPES, usedUnits } from '../lib/leave';
import type { Employee, LeaveRequest, WorkType } from '../types';
import { Badge } from './Badge';
import { MiniCalendars } from './MiniCalendars';

interface StaffViewProps {
  actives: Employee[];
  requests: LeaveRequest[];
  empById: Record<string, Employee>;
  updateRequests: (fn: (prev: LeaveRequest[]) => LeaveRequest[]) => void;
}

export function StaffView({ actives, requests, empById, updateRequests }: StaffViewProps) {
  const [empId, setEmpId] = useState(actives[0]?.id || '');
  const [pickDate, setPickDate] = useState<string | null>(null);
  const [hourly, setHourly] = useState(false);
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('15:00');

  const emp = empById[empId];
  const granted = (emp?.annualDays || 0) * DAY_UNITS;
  const used = usedUnits(empId, requests);
  const remaining = granted - used;
  const rem = decompose(remaining);
  const over = remaining < 0;

  const myReqs = useMemo(
    () =>
      requests
        .filter((r) => r.employeeId === empId && r.status !== 'rejected')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [requests, empId],
  );
  const dayReqs = pickDate ? myReqs.filter((r) => r.date === pickDate) : [];

  const closeModal = () => {
    setPickDate(null);
    setHourly(false);
  };

  const book = (type: WorkType) => {
    if (type === 'hourly') {
      setHourly(true);
      return;
    }
    addReq(type);
  };

  const addReq = (type: WorkType, sT = '', eT = '') => {
    if (!pickDate) return;
    updateRequests((prev) => [
      ...prev,
      {
        id: 'r' + Date.now(),
        employeeId: empId,
        date: pickDate,
        type,
        startTime: sT,
        endTime: eT,
        reason: '',
        status: 'requested',
        managerMemo: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    closeModal();
  };

  const cancel = (id: string) => updateRequests((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-500">직원</label>
        <select
          value={empId}
          onChange={(e) => setEmpId(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium focus:border-slate-500 focus:outline-none"
        >
          {actives.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name} · {e.role}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(
          [
            ['연차', rem.annual, 'border-red-200 bg-red-50 text-red-600'],
            ['반차', rem.half, 'border-orange-200 bg-orange-50 text-orange-600'],
            ['시간차', rem.hourly, 'border-yellow-200 bg-yellow-50 text-yellow-700'],
          ] as const
        ).map(([label, val, cls]) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${cls}`}>
            <div className="text-xs font-medium opacity-80">남은 {label}</div>
            <div className="mt-1 text-4xl font-extrabold">{val}</div>
            <div className="text-xs opacity-70">개</div>
          </div>
        ))}
      </div>

      <p className="-mt-2 text-center text-xs text-slate-500">
        {over ? (
          <span className="font-semibold text-rose-600">⚠ 부여량을 초과했습니다</span>
        ) : (
          <>
            총 부여 {emp?.annualDays}일 · 신청 포함 사용예정 {(used / DAY_UNITS).toFixed(1)}일 → 남은{' '}
            {(remaining / DAY_UNITS).toFixed(1)}일 상당
          </>
        )}
      </p>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          📅 날짜를 눌러 신청하세요
          <span className="text-xs font-normal text-slate-400">— 날짜 탭 → 종류 선택이면 끝</span>
        </h2>
        <MiniCalendars
          requests={myReqs}
          empById={empById}
          showNames={false}
          onDayClick={(d) => {
            setPickDate(d);
            setHourly(false);
          }}
        />
      </div>

      {myReqs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">내 신청 내역</h2>
          <ul className="space-y-1.5">
            {myReqs.map((r) => {
              const t = TYPES[r.type];
              const s = REQ_STATUS[r.status];
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-slate-700">{r.date.slice(5)}</span>
                  <Badge cls={t.cls}>
                    {t.label}
                    {r.type === 'hourly' && r.startTime ? ` ${r.startTime}~${r.endTime}` : ''}
                  </Badge>
                  <Badge cls={s.cls}>{s.label}</Badge>
                  {r.status === 'requested' && (
                    <button
                      type="button"
                      onClick={() => cancel(r.id)}
                      className="ml-auto rounded px-1.5 text-xs text-slate-400 hover:text-rose-500"
                    >
                      취소 ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pickDate && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center sm:items-center"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {pickDate.slice(5).replace('-', '/')}
                </div>
                <div className="text-xs text-slate-400">{emp?.name} 님 신청</div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {dayReqs.length > 0 && (
              <div className="mb-3 space-y-1">
                {dayReqs.map((r) => {
                  const t = TYPES[r.type];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm"
                    >
                      <Badge cls={t.cls}>
                        {t.label}
                        {r.type === 'hourly' && r.startTime ? ` ${r.startTime}~${r.endTime}` : ''}
                      </Badge>
                      <Badge cls={REQ_STATUS[r.status].cls}>{REQ_STATUS[r.status].label}</Badge>
                      {r.status === 'requested' && (
                        <button
                          type="button"
                          onClick={() => cancel(r.id)}
                          className="ml-auto text-xs text-slate-400 hover:text-rose-500"
                        >
                          취소 ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!hourly ? (
              <div className="grid grid-cols-2 gap-2">
                {TYPE_ORDER.map((k) => {
                  const t = TYPES[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => book(k)}
                      className={`rounded-2xl py-4 text-base font-bold text-white transition ${t.btn}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">시작</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">종료</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => addReq('hourly', startTime, endTime)}
                  className="w-full rounded-2xl bg-yellow-500 py-3.5 text-base font-bold text-white hover:bg-yellow-600"
                >
                  시간차 신청
                </button>
                <button
                  type="button"
                  onClick={() => setHourly(false)}
                  className="mt-2 w-full rounded-xl py-2 text-sm text-slate-400 hover:bg-slate-50"
                >
                  ← 뒤로
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
