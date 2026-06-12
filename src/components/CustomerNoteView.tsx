import { useState } from 'react';
import { CUSTOMER_TAGS } from '../data/customerTags';
import { daysInMonth, pad, weekdayOf, WD_KR, ymd } from '../lib/date';
import { customerNoteStore, exportNotesCSV } from '../lib/customerNoteStore';
import type { NoteSession } from '../lib/noteSession';
import type { CustomerNote } from '../types';

interface CustomerNoteViewProps {
  session: NoteSession;
}

function todayStr() {
  const d = new Date();
  return ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function CustomerNoteView({ session }: CustomerNoteViewProps) {
  const [date, setDate] = useState(todayStr);
  const [customerName, setCustomerName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [notes, setNotes] = useState<CustomerNote[]>(() => customerNoteStore.load());
  const [savedMsg, setSavedMsg] = useState('');

  const [viewY, setViewY] = useState(() => new Date().getFullYear());
  const [viewM, setViewM] = useState(() => new Date().getMonth() + 1);

  const shiftMonth = (delta: number) => {
    let y = viewY;
    let m = viewM + delta;
    if (m > 12) {
      m = 1;
      y++;
    } else if (m < 1) {
      m = 12;
      y--;
    }
    setViewY(y);
    setViewM(m);
  };

  const cal = { y: viewY, m: viewM };

  const today = todayStr();

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const save = () => {
    if (!customerName.trim()) {
      alert('고객명을 입력해주세요.');
      return;
    }
    if (!memo.trim()) {
      alert('핵심메모를 입력해주세요.');
      return;
    }

    const note: CustomerNote = {
      id: 'n' + Date.now(),
      date,
      customerName: customerName.trim(),
      tags: [...tags],
      memo: memo.trim(),
      authorId: session.employeeId,
      authorName: session.employeeName,
      authorPinId: session.authorPinId,
      createdAt: new Date().toISOString(),
    };

    const next = customerNoteStore.add(note);
    setNotes(next);
    setCustomerName('');
    setTags([]);
    setMemo('');
    setSavedMsg(`✓ ${note.customerName} 님 저장됨`);
    setTimeout(() => setSavedMsg(''), 2500);
  };

  const total = daysInMonth(cal.y, cal.m);
  const firstWd = weekdayOf(cal.y, cal.m, 1);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);

  const todayNotes = notes.filter((n) => n.date === date);

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-6">
      {savedMsg && (
        <div className="rounded-2xl bg-[#FEE500] px-4 py-3 text-center text-sm font-bold text-[#3B1E1E] shadow-sm">
          {savedMsg}
        </div>
      )}

      {/* 1. 날짜 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">① 상담 날짜</h2>
          <button
            type="button"
            onClick={() => setDate(today)}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 active:bg-slate-200"
          >
            오늘
          </button>
        </div>
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-xl px-3 py-2 text-slate-500 active:bg-slate-100"
          >
            ‹
          </button>
          <div className="text-center text-base font-bold text-slate-700">
            {cal.y}.{pad(cal.m)}
            {date.startsWith(`${cal.y}-${pad(cal.m)}`) && (
              <span className="ml-1 text-sm font-medium text-slate-500">
                ({date === today ? '오늘' : date.slice(8) + '일'})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-xl px-3 py-2 text-slate-500 active:bg-slate-100"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {WD_KR.map((w, i) => (
            <div
              key={w}
              className={`py-1 text-center text-xs font-medium ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-slate-400'}`}
            >
              {w}
            </div>
          ))}
          {cells.map((d, idx) => {
            if (d === null) return <div key={`b${idx}`} />;
            const ds = ymd(cal.y, cal.m, d);
            const selected = ds === date;
            const isToday = ds === today;
            return (
              <button
                key={ds}
                type="button"
                onClick={() => setDate(ds)}
                className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition active:scale-95 ${
                  selected
                    ? 'bg-[#FEE500] text-[#3B1E1E]'
                    : isToday
                      ? 'bg-slate-100 text-slate-800'
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. 고객명 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-slate-800">② 고객명</h2>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="이름 입력"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-lg font-medium placeholder:text-slate-300 focus:border-[#FEE500] focus:outline-none"
        />
      </section>

      {/* 3. 태그 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-bold text-slate-800">③ 태그 선택</h2>
        <p className="mb-3 text-xs text-slate-400">여러 개 선택 가능 · 통계·검색용</p>
        <div className="flex flex-wrap gap-2">
          {CUSTOMER_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-95 ${
                  on
                    ? 'bg-[#FEE500] text-[#3B1E1E] shadow-sm'
                    : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. 핵심메모 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-bold text-slate-800">④ 핵심메모</h2>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="상담 핵심만 간단히 (사람이 읽는 메모)"
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base leading-relaxed placeholder:text-slate-300 focus:border-[#FEE500] focus:outline-none"
        />
      </section>

      {/* 5. 저장 */}
      <button
        type="button"
        onClick={save}
        className="w-full rounded-2xl bg-[#FEE500] py-4 text-lg font-bold text-[#3B1E1E] shadow-md transition active:scale-[0.98] active:bg-[#F5DC00]"
      >
        저장
      </button>

      {/* 오늘 저장 현황 + CSV */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">
            이 날짜 저장 <strong className="text-slate-900">{todayNotes.length}</strong>건 · 전체{' '}
            <strong className="text-slate-900">{notes.length}</strong>건
          </span>
          {notes.length > 0 && (
            <button
              type="button"
              onClick={() => exportNotesCSV(notes)}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white active:bg-slate-900"
            >
              CSV
            </button>
          )}
        </div>
        {todayNotes.length > 0 && (
          <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {todayNotes.slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{n.customerName}</span>
                  <span className="text-xs text-slate-400">{n.authorName}</span>
                </div>
                {n.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {n.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#FEE500]/60 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 line-clamp-2 text-slate-600">{n.memo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
