import { useRef, useState } from 'react';
import { formatTagLabel } from '../data/customerTags';
import { customerNoteStore, exportNotesCSV } from '../lib/customerNoteStore';
import { pad } from '../lib/date';
import { parseShareInput } from '../lib/noteTransfer';

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdminNotesPanel() {
  const [notes, setNotes] = useState(() => customerNoteStore.sortByNewest(customerNoteStore.load()));
  const [importOpen, setImportOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setNotes(customerNoteStore.sortByNewest(customerNoteStore.load()));

  const removeNote = (id: string, customerName: string) => {
    if (!confirm(`「${customerName}」 기록을 삭제할까요?`)) return;
    const next = customerNoteStore.remove(id);
    setNotes(customerNoteStore.sortByNewest(next));
  };

  const clearAll = () => {
    if (notes.length === 0) return;
    if (!confirm(`전체 ${notes.length}건을 모두 삭제할까요?\n삭제 후에는 복구할 수 없습니다.`)) return;
    if (!confirm('정말 전체 삭제하시겠습니까?')) return;
    customerNoteStore.clear();
    setNotes([]);
  };

  const doImport = (raw: string) => {
    try {
      const incoming = parseShareInput(raw);
      if (incoming.length === 0) {
        setImportMsg('가져올 기록이 없습니다.');
        return;
      }
      const { added, skipped } = customerNoteStore.mergeImport(incoming);
      refresh();
      setImportMsg(`✓ ${added}건 추가${skipped ? ` · ${skipped}건 중복 제외` : ''}`);
      setPasteText('');
      if (fileRef.current) fileRef.current.value = '';
      setTimeout(() => setImportMsg(''), 4000);
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : '가져오기 실패');
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => doImport(String(reader.result ?? ''));
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-800">
          전체 환자 기록 <span className="text-sm font-normal text-slate-500">({notes.length}건)</span>
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setImportOpen((v) => !v)}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100"
          >
            직원 노트 가져오기
          </button>
          {notes.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => exportNotesCSV(notes)}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                CSV
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100"
              >
                전체 삭제
              </button>
            </>
          )}
        </div>
      </div>

      {importOpen && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
          <p className="text-sm text-slate-600">
            직원이 폰에서 보낸 <strong>.json 파일</strong>을 선택하거나 내용을 붙여넣으세요.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json,text/plain"
            className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-sky-700"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="JSON 파일 내용 붙여넣기"
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => doImport(pasteText)}
              disabled={!pasteText.trim()}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-40"
            >
              합치기
            </button>
            {importMsg && <span className="text-sm text-slate-600">{importMsg}</span>}
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">
          기록이 없습니다. 직원 폰에서 「노트 보내기」로 받은 파일을 가져오세요.
        </p>
      ) : (
        <ul className="max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">{fmtDateTime(n.createdAt)}</span>
                    <span className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-500">
                      상담 {n.date.slice(5).replace('-', '/')}
                    </span>
                    <span className="font-bold text-slate-800">{n.customerName}</span>
                    <span className="rounded-full bg-[#FEE500]/70 px-2 py-0.5 text-xs font-medium text-[#3B1E1E]">
                      {n.authorName}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeNote(n.id, n.customerName)}
                  className="shrink-0 rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 active:bg-rose-50"
                >
                  삭제
                </button>
              </div>
              {n.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {n.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 ring-1 ring-slate-200"
                    >
                      {formatTagLabel(t)}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1.5 whitespace-pre-wrap text-slate-700">{n.memo}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
