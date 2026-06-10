import React, { useState, useMemo, useCallback } from "react";

/* ============================================================================
 *  뉴센스의원 — 연차 잔여 관리 (Leave Balance MVP, v2: 달력 탭 신청)
 *
 *  환산: 연차 1 = 반차 2 = 시간차 8   →  연차 8u · 반차 4u · 시간차 1u
 *  직원 입력 = 3개월 달력에서 날짜 탭 → 종류 탭 → 즉시 신청
 *  데이터 레이어는 store 한 곳에 격리 — localStorage/Supabase 교체 지점.
 * ========================================================================== */

const DAY_UNITS = 8;
const TYPES = {
  annual:  { label: "연차",     short: "연차", unit: 8, cls: "bg-red-100 text-red-700 border-red-300",        btn: "bg-red-500 hover:bg-red-600" },
  half_am: { label: "오전반차", short: "오전", unit: 4, cls: "bg-orange-100 text-orange-700 border-orange-300", btn: "bg-orange-500 hover:bg-orange-600" },
  half_pm: { label: "오후반차", short: "오후", unit: 4, cls: "bg-orange-100 text-orange-700 border-orange-300", btn: "bg-orange-500 hover:bg-orange-600" },
  hourly:  { label: "시간차",   short: "시간", unit: 1, cls: "bg-yellow-100 text-yellow-800 border-yellow-300", btn: "bg-yellow-500 hover:bg-yellow-600" },
};
const TYPE_ORDER = ["annual", "half_am", "half_pm", "hourly"];

const REQ_STATUS = {
  requested: { label: "신청",     cls: "bg-amber-100 text-amber-800" },
  approved:  { label: "승인",     cls: "bg-emerald-100 text-emerald-700" },
  rejected:  { label: "반려",     cls: "bg-rose-100 text-rose-700" },
  revise:    { label: "수정요청", cls: "bg-sky-100 text-sky-700" },
};
const ACTIVE_STATUSES = ["requested", "approved", "revise"];
const ROLE_OPTIONS = ["접수", "간호", "상담", "시술보조", "기타"];

/* ---------- 날짜 유틸 ---------- */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
const weekdayOf = (y, m, d) => new Date(y, m - 1, d).getDay();
const WD_KR = ["일", "월", "화", "수", "목", "금", "토"];
function monthsFrom(date, n) {
  const arr = []; let y = date.getFullYear(), m = date.getMonth() + 1;
  for (let i = 0; i < n; i++) { arr.push({ y, m }); m++; if (m > 12) { m = 1; y++; } }
  return arr;
}
const KR_HOLIDAYS_2026 = {
  "2026-01-01": "신정", "2026-02-16": "설날", "2026-02-17": "설날", "2026-02-18": "설날",
  "2026-03-01": "삼일절", "2026-03-02": "대체", "2026-05-05": "어린이날", "2026-05-24": "석가탄신일",
  "2026-05-25": "대체", "2026-06-06": "현충일", "2026-08-15": "광복절", "2026-08-17": "대체",
  "2026-09-24": "추석", "2026-09-25": "추석", "2026-09-26": "추석", "2026-10-03": "개천절",
  "2026-10-05": "대체", "2026-10-09": "한글날", "2026-12-25": "성탄절",
};

/* ---------- 잔여 계산 ---------- */
function usedUnits(empId, requests, statuses = ACTIVE_STATUSES) {
  return requests.filter((r) => r.employeeId === empId && statuses.includes(r.status))
    .reduce((a, r) => a + (TYPES[r.type]?.unit || 0), 0);
}
function decompose(units) {
  let u = Math.max(0, units);
  const annual = Math.floor(u / 8); u %= 8;
  const half = Math.floor(u / 4); u %= 4;
  return { annual, half, hourly: u };
}
function countType(empId, type, requests, statuses = ACTIVE_STATUSES) {
  return requests.filter((r) => r.employeeId === empId && r.type === type && statuses.includes(r.status)).length;
}

/* ============================================================================
 *  데이터 레이어 (★ 교체 지점 ★)
 * ========================================================================== */
function seed() {
  const next = monthsFrom(new Date(), 2)[1];
  const D = (d) => ymd(next.y, next.m, d);
  const now = new Date().toISOString();
  const r = (id, employeeId, date, type, status, extra = {}) => ({
    id, employeeId, date, type, status, startTime: "", endTime: "", reason: "", managerMemo: "", createdAt: now, updatedAt: now, ...extra,
  });
  const employees = [
    { id: "e1", name: "김지은", role: "접수",     isJapaneseAvailable: false, isActive: true, annualDays: 15 },
    { id: "e2", name: "박서연", role: "간호",     isJapaneseAvailable: false, isActive: true, annualDays: 15 },
    { id: "e3", name: "이하루", role: "상담",     isJapaneseAvailable: true,  isActive: true, annualDays: 15 },
    { id: "e4", name: "최민수", role: "시술보조", isJapaneseAvailable: false, isActive: true, annualDays: 12 },
    { id: "e5", name: "정유진", role: "간호",     isJapaneseAvailable: true,  isActive: true, annualDays: 15 },
  ];
  const requests = [
    r("s1", "e1", D(6),  "annual",  "approved",  { reason: "여행" }),
    r("s2", "e1", D(7),  "annual",  "approved"),
    r("s3", "e1", D(13), "annual",  "approved"),
    r("s4", "e1", D(20), "annual",  "requested"),
    r("s5", "e1", D(21), "half_am", "approved"),
    r("s6", "e3", D(7),  "annual",  "requested"),
    r("s7", "e3", D(14), "hourly",  "approved",  { startTime: "13:00", endTime: "15:00" }),
    r("s8", "e2", D(7),  "half_pm", "approved"),
    r("s9", "e5", D(21), "annual",  "requested"),
  ];
  return { employees, requests };
}
const store = {
  load() {
    // localStorage 버전:
    // const e = localStorage.getItem("nsc_emp"), r = localStorage.getItem("nsc_req");
    // if (e && r) return { employees: JSON.parse(e), requests: JSON.parse(r) };
    // const init = seed(); this.save(init); return init;
    return seed();
  },
  save(state) {
    // localStorage.setItem("nsc_emp", JSON.stringify(state.employees));
    // localStorage.setItem("nsc_req", JSON.stringify(state.requests));
    void state;
  },
};

function Badge({ children, cls }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

/* ---------- 3개월 달력 (탭 신청 지원) ---------- */
function MiniCalendars({ requests, empById, showNames, onDayClick }) {
  const months = useMemo(() => monthsFrom(new Date(), 3), []);
  const todayStr = ymd(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  const byDate = useMemo(() => {
    const m = {};
    requests.filter((r) => ACTIVE_STATUSES.includes(r.status)).forEach((r) => (m[r.date] ||= []).push(r));
    return m;
  }, [requests]);

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {months.map(({ y, m }) => {
        const total = daysInMonth(y, m);
        const firstWd = weekdayOf(y, m, 1);
        const cells = [];
        for (let i = 0; i < firstWd; i++) cells.push(null);
        for (let d = 1; d <= total; d++) cells.push(d);
        return (
          <div key={`${y}-${m}`} className="rounded-xl border border-slate-200 bg-white p-2.5">
            <div className="mb-1.5 text-center text-sm font-bold text-slate-700">{y}.{pad(m)}</div>
            <div className="grid grid-cols-7 gap-0.5">
              {WD_KR.map((w, i) => (
                <div key={w} className={`pb-0.5 text-center text-xs font-medium ${i === 0 ? "text-rose-400" : i === 6 ? "text-sky-400" : "text-slate-300"}`}>{w}</div>
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
                      <span className={`font-semibold ${isToday ? "rounded bg-slate-800 px-1 text-white" : hol || wd === 0 ? "text-rose-500" : wd === 6 ? "text-sky-500" : "text-slate-500"}`}>{d}</span>
                      {overlap && <span className="text-xs">⚠️</span>}
                    </div>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      {list.slice(0, 3).map((req) => {
                        const t = TYPES[req.type]; const pending = req.status === "requested";
                        return (
                          <div key={req.id} title={`${empById[req.employeeId]?.name || ""} ${t.label}${pending ? " (신청)" : ""}`}
                            className={`truncate rounded px-1 leading-tight ${t.cls} ${pending ? "opacity-60" : ""}`}>
                            {showNames ? `${empById[req.employeeId]?.name?.slice(0, 1) || ""} ` : ""}{t.short}
                          </div>
                        );
                      })}
                      {list.length > 3 && <div className="text-center text-slate-400">+{list.length - 3}</div>}
                    </div>
                  </>
                );
                const base = `flex min-h-12 flex-col rounded-md border p-0.5 text-left text-xs ${overlap ? "border-rose-300 bg-rose-50" : "border-slate-100"}`;
                return clickable ? (
                  <button key={date} onClick={() => onDayClick(date)} className={`${base} transition hover:border-slate-400 hover:bg-slate-50`}>{Inner}</button>
                ) : (
                  <div key={date} className={base}>{Inner}</div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 *  메인
 * ========================================================================== */
export default function App() {
  const initial = useMemo(() => store.load(), []);
  const [employees, setEmployees] = useState(initial.employees);
  const [requests, setRequests] = useState(initial.requests);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState("balance");

  const persist = useCallback((e, r) => store.save({ employees: e, requests: r }), []);
  const updateRequests = (fn) => setRequests((prev) => { const next = fn(prev); persist(employees, next); return next; });
  const updateEmployees = (fn) => setEmployees((prev) => { const next = fn(prev); persist(next, requests); return next; });

  const empById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])), [employees]);
  const actives = employees.filter((e) => e.isActive);
  const pendingCount = requests.filter((r) => r.status === "requested").length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-sm font-bold text-white">N</div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">뉴센스의원 연차 관리</h1>
              <p className="text-xs text-slate-500">남은 연차 · 반차 · 시간차 한눈에</p>
            </div>
          </div>
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-sm">
            <button onClick={() => setIsAdmin(false)} className={`rounded-md px-3 py-1.5 font-medium ${!isAdmin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>직원</button>
            <button onClick={() => setIsAdmin(true)} className={`rounded-md px-3 py-1.5 font-medium ${isAdmin ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>관리자</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {!isAdmin ? (
          <StaffView actives={actives} requests={requests} empById={empById} updateRequests={updateRequests} />
        ) : (
          <>
            <div className="mb-5 flex flex-wrap gap-1.5">
              {[["balance", "직원 잔여현황"], ["calendar", "3개월 달력"], ["approve", `승인${pendingCount ? ` (${pendingCount})` : ""}`]].map(([k, label]) => (
                <button key={k} onClick={() => setAdminTab(k)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium ${adminTab === k ? "bg-slate-800 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>{label}</button>
              ))}
            </div>
            {adminTab === "balance" && <AdminBalance employees={employees} requests={requests} updateEmployees={updateEmployees} />}
            {adminTab === "calendar" && <AdminCalendar actives={actives} requests={requests} empById={empById} />}
            {adminTab === "approve" && <ApprovePanel requests={requests} empById={empById} updateRequests={updateRequests} />}
          </>
        )}

        <footer className="mt-8 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          환산: 반차 2 = 연차 1 · 시간차 4 = 반차 1 · 시간차 8 = 연차 1 · MVP 데모(세션 저장)
        </footer>
      </main>
    </div>
  );
}

/* ============================================================================
 *  직원 화면 — 큰 잔여 → 달력에서 날짜 탭 → 종류 탭 → 즉시 신청
 * ========================================================================== */
function StaffView({ actives, requests, empById, updateRequests }) {
  const [empId, setEmpId] = useState(actives[0]?.id || "");
  const [pickDate, setPickDate] = useState(null);   // 신청 모달 대상 날짜
  const [hourly, setHourly] = useState(false);      // 시간차 시간 입력 단계
  const [startTime, setStartTime] = useState("13:00");
  const [endTime, setEndTime] = useState("15:00");

  const emp = empById[empId];
  const granted = (emp?.annualDays || 0) * DAY_UNITS;
  const used = usedUnits(empId, requests);
  const remaining = granted - used;
  const rem = decompose(remaining);
  const over = remaining < 0;

  const myReqs = useMemo(
    () => requests.filter((r) => r.employeeId === empId && r.status !== "rejected").sort((a, b) => a.date.localeCompare(b.date)),
    [requests, empId]
  );
  const dayReqs = pickDate ? myReqs.filter((r) => r.date === pickDate) : [];

  const closeModal = () => { setPickDate(null); setHourly(false); };
  const book = (type) => {
    if (type === "hourly") { setHourly(true); return; }
    addReq(type);
  };
  const addReq = (type, sT = "", eT = "") => {
    updateRequests((prev) => [...prev, {
      id: "r" + Date.now(), employeeId: empId, date: pickDate, type,
      startTime: sT, endTime: eT, reason: "", status: "requested", managerMemo: "",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }]);
    closeModal();
  };
  const cancel = (id) => updateRequests((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="space-y-5">
      {/* 직원 선택 */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-500">직원</label>
        <select value={empId} onChange={(e) => setEmpId(e.target.value)}
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium focus:border-slate-500 focus:outline-none">
          {actives.map((e) => <option key={e.id} value={e.id}>{e.name} · {e.role}</option>)}
        </select>
      </div>

      {/* 큰 잔여 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[["연차", rem.annual, "border-red-200 bg-red-50 text-red-600"],
          ["반차", rem.half, "border-orange-200 bg-orange-50 text-orange-600"],
          ["시간차", rem.hourly, "border-yellow-200 bg-yellow-50 text-yellow-700"]].map(([label, val, cls]) => (
          <div key={label} className={`rounded-2xl border p-4 text-center ${cls}`}>
            <div className="text-xs font-medium opacity-80">남은 {label}</div>
            <div className="mt-1 text-4xl font-extrabold">{val}</div>
            <div className="text-xs opacity-70">개</div>
          </div>
        ))}
      </div>
      <p className="-mt-2 text-center text-xs text-slate-500">
        {over ? <span className="font-semibold text-rose-600">⚠ 부여량을 초과했습니다</span>
          : <>총 부여 {emp?.annualDays}일 · 신청 포함 사용예정 {(used / DAY_UNITS).toFixed(1)}일 → 남은 {(remaining / DAY_UNITS).toFixed(1)}일 상당</>}
      </p>

      {/* 안내 + 3개월 달력 (= 입력) */}
      <div>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          📅 날짜를 눌러 신청하세요
          <span className="text-xs font-normal text-slate-400">— 날짜 탭 → 종류 선택이면 끝</span>
        </h2>
        <MiniCalendars requests={myReqs} empById={empById} showNames={false} onDayClick={(d) => { setPickDate(d); setHourly(false); }} />
      </div>

      {/* 신청 내역 */}
      {myReqs.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">내 신청 내역</h2>
          <ul className="space-y-1.5">
            {myReqs.map((r) => {
              const t = TYPES[r.type]; const s = REQ_STATUS[r.status];
              return (
                <li key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="font-semibold text-slate-700">{r.date.slice(5)}</span>
                  <Badge cls={t.cls}>{t.label}{r.type === "hourly" && r.startTime ? ` ${r.startTime}~${r.endTime}` : ""}</Badge>
                  <Badge cls={s.cls}>{s.label}</Badge>
                  {r.status === "requested" && (
                    <button onClick={() => cancel(r.id)} className="ml-auto rounded px-1.5 text-xs text-slate-400 hover:text-rose-500">취소 ✕</button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* 신청 모달 */}
      {pickDate && (
        <div className="fixed inset-0 z-30 flex items-end justify-center sm:items-center" style={{ backgroundColor: "rgba(15,23,42,0.45)" }} onClick={closeModal}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-slate-800">{pickDate.slice(5).replace("-", "/")}</div>
                <div className="text-xs text-slate-400">{emp?.name} 님 신청</div>
              </div>
              <button onClick={closeModal} className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100">✕</button>
            </div>

            {/* 이 날 이미 신청한 내역 */}
            {dayReqs.length > 0 && (
              <div className="mb-3 space-y-1">
                {dayReqs.map((r) => {
                  const t = TYPES[r.type];
                  return (
                    <div key={r.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-sm">
                      <Badge cls={t.cls}>{t.label}{r.type === "hourly" && r.startTime ? ` ${r.startTime}~${r.endTime}` : ""}</Badge>
                      <Badge cls={REQ_STATUS[r.status].cls}>{REQ_STATUS[r.status].label}</Badge>
                      {r.status === "requested" && <button onClick={() => cancel(r.id)} className="ml-auto text-xs text-slate-400 hover:text-rose-500">취소 ✕</button>}
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
                    <button key={k} onClick={() => book(k)}
                      className={`rounded-2xl py-4 text-base font-bold text-white transition ${t.btn}`}>
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
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">종료</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm" />
                  </div>
                </div>
                <button onClick={() => addReq("hourly", startTime, endTime)} className="w-full rounded-2xl bg-yellow-500 py-3.5 text-base font-bold text-white hover:bg-yellow-600">시간차 신청</button>
                <button onClick={() => setHourly(false)} className="mt-2 w-full rounded-xl py-2 text-sm text-slate-400 hover:bg-slate-50">← 뒤로</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 *  관리자 — 직원 잔여현황
 * ========================================================================== */
function AdminBalance({ employees, requests, updateEmployees }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [days, setDays] = useState(15);

  const rows = employees.filter((e) => e.isActive).map((e) => {
    const granted = e.annualDays * DAY_UNITS;
    const used = usedUnits(e.id, requests);
    const rem = decompose(granted - used);
    const usedAnnual = countType(e.id, "annual", requests);
    const usedHalf = countType(e.id, "half_am", requests) + countType(e.id, "half_pm", requests);
    const usedHourly = countType(e.id, "hourly", requests);
    const pending = requests.filter((r) => r.employeeId === e.id && r.status === "requested").length;
    return { e, rem, usedAnnual, usedHalf, usedHourly, pending, over: granted - used < 0 };
  });

  const addEmp = () => {
    if (!name.trim()) return;
    updateEmployees((prev) => [...prev, { id: "e" + Date.now(), name: name.trim(), role, isJapaneseAvailable: false, isActive: true, annualDays: Number(days) }]);
    setName("");
  };
  const setDaysFor = (id, v) => updateEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, annualDays: Math.max(0, Number(v)) } : e)));
  const deactivate = (id) => updateEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: false } : e)));

  const downloadCSV = () => {
    const head = ["직원명", "역할", "부여연차(일)", "사용연차", "사용반차", "사용시간차", "남은연차", "남은반차", "남은시간차", "승인대기"];
    const body = rows.map((r) => [r.e.name, r.e.role, r.e.annualDays, r.usedAnnual, r.usedHalf, r.usedHourly, r.rem.annual, r.rem.half, r.rem.hourly, r.pending]);
    const csv = "\uFEFF" + [head, ...body].map((x) => x.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "연차잔여.csv"; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">직원 잔여현황</h2>
        <button onClick={downloadCSV} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">CSV</button>
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
                <td className="px-3 py-2.5 font-medium text-slate-700">{r.e.name}<div className="text-xs text-slate-400">{r.e.role}{r.e.isJapaneseAvailable ? " · 🇯🇵" : ""}</div></td>
                <td className="px-2 py-2.5">
                  <input type="number" min={0} value={r.e.annualDays} onChange={(e) => setDaysFor(r.e.id, e.target.value)} className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm" />
                </td>
                <td className="px-2 py-2.5 text-slate-500">{r.usedAnnual} / {r.usedHalf} / {r.usedHourly}</td>
                <td className="px-2 py-2.5">
                  {r.over ? <Badge cls="bg-rose-100 text-rose-700">초과</Badge> : (
                    <span className="flex items-center gap-1.5 font-semibold">
                      <span className="text-red-600">연차 {r.rem.annual}</span>
                      <span className="text-orange-600">반차 {r.rem.half}</span>
                      <span className="text-yellow-700">시간 {r.rem.hourly}</span>
                    </span>
                  )}
                </td>
                <td className="px-2 py-2.5">{r.pending ? <Badge cls="bg-amber-100 text-amber-800">{r.pending}</Badge> : "-"}</td>
                <td className="px-2 py-2.5"><button onClick={() => deactivate(r.e.id)} className="text-xs text-slate-300 hover:text-rose-500">삭제</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-500">직원명</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">역할</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg border border-slate-300 px-2.5 py-2 text-sm">
            {ROLE_OPTIONS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">부여 연차</label>
          <input type="number" min={0} value={days} onChange={(e) => setDays(e.target.value)} className="w-20 rounded-lg border border-slate-300 px-2 py-2 text-right text-sm" />
        </div>
        <button onClick={addEmp} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">추가</button>
      </div>
    </div>
  );
}

/* ============================================================================
 *  관리자 — 3개월 달력
 * ========================================================================== */
function AdminCalendar({ actives, requests, empById }) {
  const [sel, setSel] = useState("all");
  const filtered = sel === "all" ? requests : requests.filter((r) => r.employeeId === sel);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-500">보기</label>
        <select value={sel} onChange={(e) => setSel(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
          <option value="all">전체 직원</option>
          {actives.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <span className="text-xs text-slate-400">⚠️ 같은 날 2명 이상 부재 시 표시</span>
      </div>
      <MiniCalendars requests={filtered} empById={empById} showNames={sel === "all"} />
    </div>
  );
}

/* ============================================================================
 *  관리자 — 승인
 * ========================================================================== */
function ApprovePanel({ requests, empById, updateRequests }) {
  const [filter, setFilter] = useState("requested");
  const list = requests.filter((r) => (filter === "all" ? true : r.status === filter)).sort((a, b) => a.date.localeCompare(b.date));
  const setStatus = (id, status) => updateRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r)));
  const setMemo = (id, v) => updateRequests((prev) => prev.map((r) => (r.id === id ? { ...r, managerMemo: v } : r)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">승인 관리</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm">
          <option value="requested">대기</option><option value="approved">승인</option>
          <option value="revise">수정요청</option><option value="rejected">반려</option><option value="all">전체</option>
        </select>
      </div>
      {list.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">해당 신청 없음</p> : (
        <ul className="space-y-2.5">
          {list.map((r) => {
            const t = TYPES[r.type]; const s = REQ_STATUS[r.status];
            return (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{r.date.slice(5)}</span>
                  <span className="text-sm font-medium">{empById[r.employeeId]?.name}</span>
                  <Badge cls={t.cls}>{t.label}{r.type === "hourly" && r.startTime ? ` ${r.startTime}~${r.endTime}` : ""}</Badge>
                  <Badge cls={s.cls}>{s.label}</Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <input type="text" value={r.managerMemo} onChange={(e) => setMemo(r.id, e.target.value)} placeholder="관리자 메모" className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
                  <button onClick={() => setStatus(r.id, "approved")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">승인</button>
                  <button onClick={() => setStatus(r.id, "revise")} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700">수정</button>
                  <button onClick={() => setStatus(r.id, "rejected")} className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600">반려</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
