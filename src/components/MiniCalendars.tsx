import { useMemo } from 'react';
import { KR_HOLIDAYS_2026 } from '../data/holidays';
import { daysInMonth, monthsFrom, pad, weekdayOf, WD_KR, ymd } from '../lib/date';
import { ACTIVE_STATUSES, TYPES } from '../lib/leave';
import type { Employee, LeaveRequest } from '../types';

interface MiniCalendarsProps {
  requests: LeaveRequest[];
  empById: Record<string, Employee>;
  showNames: boolean;
  onDayClick?: (date: string) => void;
}

export function MiniCalendars({ requests, empById, showNames, onDayClick }: MiniCalendarsProps) {
  const months = useMemo(() => monthsFrom(new Date(), 3), []);
  const todayStr = ymd(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  const byDate = useMemo(() => {
    const m: Record<string, LeaveRequest[]> = {};
    requests
      .filter((r) => ACTIVE_STATUSES.includes(r.status))
      .forEach((r) => {
        if (!m[r.date]) m[r.date] = [];
        m[r.date].push(r);
      });
    return m;
  }, [requests]);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {months.map(({ y, m }) => {
        const total = daysInMonth(y, m);
        const firstWd = weekdayOf(y, m, 1);
        const cells: (number | null)[] = [];
        for (let i = 0; i < firstWd; i++) cells.push(null);
        for (let d = 1; d <= total; d++) cells.push(d);

        return (
          <div key={`${y}-${m}`} className="rounded-xl border border-slate-200 bg-white p-2.5">
            <div className="mb-1.5 text-center text-sm font-bold text-slate-700">
              {y}.{pad(m)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {WD_KR.map((w, i) => (
                <div
                  key={w}
                  className={`pb-0.5 text-center text-xs font-medium ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-slate-300'}`}
                >
                  {w}
                </div>
              ))}
              {cells.map((d, idx) => {
                if (d === null) return <div key={`b${idx}`} />;
                const date = ymd(y, m, d);
                const wd = weekdayOf(y, m, d);
                const hol = KR_HOLIDAYS_2026[date];
                const list = byDate[date] || [];
                const overlap = showNames && list.length >= 2;
                const isToday = date === todayStr;
                const clickable = !!onDayClick;
                const Inner = (
                  <>
                    <div className="flex items-center justify-between leading-none">
                      <span
                        className={`font-semibold ${isToday ? 'rounded bg-slate-800 px-1 text-white' : hol || wd === 0 ? 'text-rose-500' : wd === 6 ? 'text-sky-500' : 'text-slate-500'}`}
                      >
                        {d}
                      </span>
                      {overlap && <span className="text-xs">⚠️</span>}
                    </div>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      {list.slice(0, 3).map((req) => {
                        const t = TYPES[req.type];
                        const pending = req.status === 'requested';
                        return (
                          <div
                            key={req.id}
                            title={`${empById[req.employeeId]?.name || ''} ${t.label}${pending ? ' (신청)' : ''}`}
                            className={`truncate rounded px-1 leading-tight ${t.cls} ${pending ? 'opacity-60' : ''}`}
                          >
                            {showNames ? `${empById[req.employeeId]?.name?.slice(0, 1) || ''} ` : ''}
                            {t.short}
                          </div>
                        );
                      })}
                      {list.length > 3 && (
                        <div className="text-center text-slate-400">+{list.length - 3}</div>
                      )}
                    </div>
                  </>
                );
                const base = `flex min-h-12 flex-col rounded-md border p-0.5 text-left text-xs ${overlap ? 'border-rose-300 bg-rose-50' : 'border-slate-100'}`;
                return clickable ? (
                  <button
                    key={date}
                    type="button"
                    onClick={() => onDayClick!(date)}
                    className={`${base} transition hover:border-slate-400 hover:bg-slate-50`}
                  >
                    {Inner}
                  </button>
                ) : (
                  <div key={date} className={base}>
                    {Inner}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
