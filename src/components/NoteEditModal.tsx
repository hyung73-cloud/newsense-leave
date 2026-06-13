import { useState } from 'react';
import type { CustomerNote } from '../types';
import { TagSelect } from './TagSelect';

interface NoteEditModalProps {
  note: CustomerNote;
  onClose: () => void;
  onSave: (patch: { date: string; customerName: string; tags: string[]; memo: string }) => void;
}

export function NoteEditModal({ note, onClose, onSave }: NoteEditModalProps) {
  const [date, setDate] = useState(note.date);
  const [customerName, setCustomerName] = useState(note.customerName);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [memo, setMemo] = useState(note.memo);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const submit = () => {
    if (!customerName.trim() || !memo.trim()) {
      alert('고객명과 메모를 입력해주세요.');
      return;
    }
    onSave({ date, customerName: customerName.trim(), tags, memo: memo.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-slate-800">기록 수정</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">상담 날짜</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">고객명</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">태그</label>
            <TagSelect tags={tags} onToggle={toggleTag} size="sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">핵심메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500"
          >
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            className="flex-1 rounded-xl bg-[#FEE500] py-2.5 text-sm font-bold text-[#3B1E1E]"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
