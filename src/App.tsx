import { useCallback, useMemo, useRef, useState } from 'react';
import { AdminBalance } from './components/AdminBalance';
import { AdminCalendar } from './components/AdminCalendar';
import { ApprovePanel } from './components/ApprovePanel';
import { CustomerNoteView } from './components/CustomerNoteView';
import { NotePinAuth } from './components/NotePinAuth';
import { StaffView } from './components/StaffView';
import { hardRefresh as doHardRefresh } from './lib/hardRefresh';
import { noteSession, type NoteSession } from './lib/noteSession';
import { store } from './lib/store';
import type { Employee, LeaveRequest } from './types';

type AdminTab = 'balance' | 'calendar' | 'approve';
type MainSection = 'leave' | 'notes';

const ADMIN_PASSWORD = '0876';

export default function App() {
  const initial = useMemo(() => store.load(), []);
  const [employees, setEmployees] = useState<Employee[]>(initial.employees);
  const [requests, setRequests] = useState<LeaveRequest[]>(initial.requests);
  const [mainSection, setMainSection] = useState<MainSection>('leave');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('balance');
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState(false);
  const [noteSessionState, setNoteSessionState] = useState<NoteSession | null>(() =>
    noteSession.load(),
  );
  const [refreshing, setRefreshing] = useState(false);

  const dataRef = useRef({ employees: initial.employees, requests: initial.requests });
  dataRef.current = { employees, requests };

  const persist = useCallback(
    (e: Employee[], r: LeaveRequest[]) => store.save({ employees: e, requests: r }),
    [],
  );

  const updateRequests = (fn: (prev: LeaveRequest[]) => LeaveRequest[]) =>
    setRequests((prev) => {
      const next = fn(prev);
      persist(dataRef.current.employees, next);
      return next;
    });

  const updateEmployees = (fn: (prev: Employee[]) => Employee[]) =>
    setEmployees((prev) => {
      const next = fn(prev);
      persist(next, dataRef.current.requests);
      return next;
    });

  const deleteEmployee = (id: string) => {
    const nextEmp = dataRef.current.employees.filter((e) => e.id !== id);
    const nextReq = dataRef.current.requests.filter((r) => r.employeeId !== id);
    setEmployees(nextEmp);
    setRequests(nextReq);
    persist(nextEmp, nextReq);
  };

  const empById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])),
    [employees],
  );
  const actives = employees.filter((e) => e.isActive);
  const pendingCount = requests.filter((r) => r.status === 'requested').length;

  const openAdmin = () => {
    setPwInput('');
    setPwError(false);
    setShowPwModal(true);
  };

  const submitPw = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowPwModal(false);
      setPwInput('');
      setPwError(false);
    } else {
      setPwError(true);
    }
  };

  const hardRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    void doHardRefresh();
  };

  const goLeave = () => {
    setMainSection('leave');
  };

  const goNotes = () => {
    setMainSection('notes');
    setIsAdmin(false);
    setNoteSessionState(noteSession.load());
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={hardRefresh}
            disabled={refreshing}
            title="강제 새로고침"
            className="flex items-center gap-2.5 rounded-xl text-left transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-60"
          >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-white">
                N
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900">
                  {mainSection === 'leave' ? '뉴센스의원 연차 관리' : '뉴센스의원 고객노트'}
                </h1>
                <p className="text-xs text-slate-500">
                  {refreshing
                    ? '새로고침 중…'
                    : mainSection === 'leave'
                      ? '남은 연차 · 반차 · 시간차 한눈에 · 탭하면 새로고침'
                      : '5초 입력 · 태그로 CRM 축적 · 탭하면 새로고침'}
                </p>
              </div>
            </button>
            {mainSection === 'leave' ? (
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
                  onClick={() => !isAdmin && openAdmin()}
                  className={`rounded-md px-3 py-1.5 font-medium ${isAdmin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  관리자
                </button>
              </div>
            ) : (
              <NotePinAuth
                employees={actives}
                session={noteSessionState}
                onLogin={setNoteSessionState}
                onLogout={() => setNoteSessionState(null)}
              />
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={goLeave}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                mainSection === 'leave'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              연차관리
            </button>
            <button
              type="button"
              onClick={goNotes}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition active:scale-[0.98] ${
                mainSection === 'notes'
                  ? 'bg-[#FEE500] text-[#3B1E1E] shadow-sm'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              고객노트
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {mainSection === 'leave' ? (
          !isAdmin ? (
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
                  onDeleteEmployee={deleteEmployee}
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
          )
        ) : noteSessionState ? (
          <CustomerNoteView session={noteSessionState} />
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-4xl">🔒</p>
            <p className="mt-3 text-base font-bold text-slate-700">PIN을 입력해주세요</p>
            <p className="mt-1 text-sm text-slate-400">
              오른쪽 상단에서 4자리 PIN 입력 후<br />
              고객노트를 작성할 수 있습니다
            </p>
          </div>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          {mainSection === 'leave'
            ? '환산: 반차 2 = 연차 1 · 시간차 4 = 반차 1 · 시간차 8 = 연차 1 · 데이터는 이 기기 브라우저에 저장됩니다'
            : '태그 = 통계·검색용 · 메모 = 상담 기록 · 데이터는 이 기기 브라우저에 저장됩니다'}
        </footer>
      </main>

      {showPwModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
          onClick={() => setShowPwModal(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold text-slate-800">관리자 비밀번호</h2>
            <p className="mt-1 text-xs text-slate-500">관리자 화면에 접근하려면 비밀번호를 입력하세요.</p>
            <input
              type="password"
              inputMode="numeric"
              value={pwInput}
              onChange={(e) => {
                setPwInput(e.target.value);
                setPwError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && submitPw()}
              placeholder="비밀번호"
              className={`mt-3 w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${pwError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-slate-500'}`}
              autoFocus
            />
            {pwError && <p className="mt-1.5 text-xs text-rose-500">비밀번호가 올바르지 않습니다.</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPwModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitPw}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-900"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
