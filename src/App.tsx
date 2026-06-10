import { useCallback, useMemo, useState } from 'react';
import { AdminBalance } from './components/AdminBalance';
import { AdminCalendar } from './components/AdminCalendar';
import { ApprovePanel } from './components/ApprovePanel';
import { StaffView } from './components/StaffView';
import { store } from './lib/store';
import type { Employee, LeaveRequest } from './types';

type AdminTab = 'balance' | 'calendar' | 'approve';

export default function App() {
  const initial = useMemo(() => store.load(), []);
  const [employees, setEmployees] = useState<Employee[]>(initial.employees);
  const [requests, setRequests] = useState<LeaveRequest[]>(initial.requests);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('balance');

  const persist = useCallback(
    (e: Employee[], r: LeaveRequest[]) => store.save({ employees: e, requests: r }),
    [],
  );

  const updateRequests = (fn: (prev: LeaveRequest[]) => LeaveRequest[]) =>
    setRequests((prev) => {
      const next = fn(prev);
      persist(employees, next);
      return next;
    });

  const updateEmployees = (fn: (prev: Employee[]) => Employee[]) =>
    setEmployees((prev) => {
      const next = fn(prev);
      persist(next, requests);
      return next;
    });

  const empById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  );
  const actives = employees.filter((e) => e.isActive);
  const pendingCount = requests.filter((r) => r.status === 'requested').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-white">
              N
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">뉴센스의원 연차 관리</h1>
              <p className="text-xs text-slate-500">남은 연차 · 반차 · 시간차 한눈에</p>
            </div>
          </div>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-sm">
            <button
              type="button"
              onClick={() => setIsAdmin(false)}
              className={`rounded-md px-3 py-1.5 font-medium ${!isAdmin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              직원
            </button>
            <button
              type="button"
              onClick={() => setIsAdmin(true)}
              className={`rounded-md px-3 py-1.5 font-medium ${isAdmin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              관리자
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {!isAdmin ? (
          <StaffView
            actives={actives}
            requests={requests}
            empById={empById}
            updateRequests={updateRequests}
          />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-1.5">
              {(
                [
                  ['balance', '직원 잔여현황'],
                  ['calendar', '3개월 달력'],
                  ['approve', `승인${pendingCount ? ` (${pendingCount})` : ''}`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAdminTab(k)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium ${adminTab === k ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {adminTab === 'balance' && (
              <AdminBalance
                employees={employees}
                requests={requests}
                updateEmployees={updateEmployees}
              />
            )}
            {adminTab === 'calendar' && (
              <AdminCalendar actives={actives} requests={requests} empById={empById} />
            )}
            {adminTab === 'approve' && (
              <ApprovePanel
                requests={requests}
                empById={empById}
                updateRequests={updateRequests}
              />
            )}
          </>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          환산: 반차 2 = 연차 1 · 시간차 4 = 반차 1 · 시간차 8 = 연차 1 · 데이터는 이 기기
          브라우저에 저장됩니다
        </footer>
      </main>
    </div>
  );
}
