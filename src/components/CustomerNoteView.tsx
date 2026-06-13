import { useMemo, useState } from 'react';
import { formatTagLabel } from '../data/customerTags';
import { daysInMonth, pad, weekdayOf, WD_KR, ymd } from '../lib/date';
import { customerNoteStore, exportNotesCSV } from '../lib/customerNoteStore';
import { copyShareCode, shareNotesFile } from '../lib/noteTransfer';
import type { NoteSession } from '../lib/noteSession';
import type { CustomerNote } from '../types';
import { NoteEditModal } from './NoteEditModal';
import { TagSelect } from './TagSelect';

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [editNote, setEditNote] = useState<CustomerNote | null>(null);
  const [shareMsg, setShareMsg] = useState('');

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
      id: crypto.randomUUID(),
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

  const myNotes = useMemo(
    () =>
      customerNoteStore.sortByNewest(
        notes.filter((n) => n.authorId === session.employeeId),
      ),
    [notes, session.employeeId],
  );

  const sendNotes = async () => {
    if (myNotes.length === 0) return;
    setShareMsg('');
    const result = await shareNotesFile(myNotes, session.employeeName);
    if (result === 'shared') setShareMsg('✓ 공유 메뉴에서 카톡 등으로 보내세요');
    else if (result === 'downloaded') setShareMsg('✓ 파일 저장됨 — 카톡으로 이 파일을 보내주세요');
    else setShareMsg('');
    setTimeout(() => setShareMsg(''), 5000);
  };

  const copyCode = async () => {
    if (myNotes.length === 0) return;
    try {
      await copyShareCode(myNotes);
      setShareMsg('✓ 전송 코드 복사됨 — 카톡에 붙여넣기');
      setTimeout(() => setShareMsg(''), 5000);
    } catch {
      setShareMsg('복사 실패 — 노트 보내기를 이용해주세요');
    }
  };

  const saveEdit = (patch: {
    date: string;
    customerName: string;
    tags: string[];
    memo: string;
  }) => {
    if (!editNote) return;
    const next = customerNoteStore.update(editNote.id, patch);
    setNotes(next);
    setEditNote(null);
    setSavedMsg('✓ 수정됨');
    setTimeout(() => setSavedMsg(''), 2000);
  };

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
        <p className="mb-3 text-xs text-slate-400">층별로 여러 개 선택 가능 · 통계·검색용</p>
        <TagSelect tags={tags} onToggle={toggleTag} />
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

      {/* 내 작성 기록 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            내 작성 기록 <span className="font-normal text-slate-500">({myNotes.length}건)</span>
          </span>
          {myNotes.length > 0 && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => void sendNotes()}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white active:bg-sky-700"
              >
                노트 보내기
              </button>
              <button
                type="button"
                onClick={() => void copyCode()}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 active:bg-slate-50"
              >
                코드복사
              </button>
              <button
                type="button"
                onClick={() => exportNotesCSV(myNotes)}
                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white active:bg-slate-900"
              >
                CSV
              </button>
            </div>
          )}
        </div>
        {shareMsg && <p className="mt-2 text-center text-xs text-sky-600">{shareMsg}</p>}
        {myNotes.length > 0 && !shareMsg && (
          <p className="mt-2 text-center text-xs text-slate-400">
            주기적으로 「노트 보내기」→ 카톡으로 관리자에게 전달
          </p>
        )}
        {myNotes.length === 0 ? (
          <p className="mt-3 text-center text-sm text-slate-400">아직 작성한 기록이 없습니다</p>
        ) : (
          <ul className="mt-3 max-h-[50vh] space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
            {myNotes.map((n) => (
              <li key={n.id} className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-slate-400">{fmtDateTime(n.createdAt)}</span>
                      <span className="text-xs text-slate-400">
                        상담 {n.date.slice(5).replace('-', '/')}
                      </span>
                    </div>
                    <div className="mt-0.5 font-bold text-slate-800">{n.customerName}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditNote(n)}
                    className="shrink-0 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-600 active:bg-sky-100"
                  >
                    수정
                  </button>
                </div>
                {n.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {n.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-[#FEE500]/60 px-2 py-0.5 text-xs text-slate-700"
                      >
                        {formatTagLabel(t)}
                      </span>
                    ))}
                  </div>
                )}
                <p className="mt-1 whitespace-pre-wrap text-slate-600">{n.memo}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editNote && (
        <NoteEditModal note={editNote} onClose={() => setEditNote(null)} onSave={saveEdit} />
      )}
    </div>
  );
}
