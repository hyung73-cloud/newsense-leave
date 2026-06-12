import type { CustomerNote } from '../types';

const KEY = 'nsc_notes';

export const customerNoteStore = {
  load(): CustomerNote[] {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CustomerNote[];
    } catch {
      return [];
    }
  },
  save(notes: CustomerNote[]) {
    localStorage.setItem(KEY, JSON.stringify(notes));
  },
  add(note: CustomerNote) {
    const notes = this.load();
    notes.unshift(note);
    this.save(notes);
    return notes;
  },
};

export function exportNotesCSV(notes: CustomerNote[]) {
  const head = [
    '작성일시',
    '상담일자',
    '작성자ID',
    '작성자명',
    '고객명',
    '태그',
    '핵심메모',
  ];
  const body = notes.map((n) => [
    n.createdAt,
    n.date,
    n.authorId,
    n.authorName,
    n.customerName,
    n.tags.join(';'),
    n.memo.replace(/\n/g, ' '),
  ]);
  const csv = '\uFEFF' + [head, ...body].map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `고객노트_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeCsv(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
