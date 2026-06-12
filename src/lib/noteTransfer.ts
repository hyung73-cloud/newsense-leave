import type { CustomerNote } from '../types';

const PREFIX = 'NSC1.';

export interface NoteShareBundle {
  v: 1;
  exportedAt: string;
  notes: CustomerNote[];
}

function utf8ToBase64(text: string) {
  return btoa(unescape(encodeURIComponent(text)));
}

function base64ToUtf8(b64: string) {
  return decodeURIComponent(escape(atob(b64)));
}

export function createShareBundle(notes: CustomerNote[]): NoteShareBundle {
  return { v: 1, exportedAt: new Date().toISOString(), notes };
}

export function encodeShareCode(bundle: NoteShareBundle) {
  const b64 = utf8ToBase64(JSON.stringify(bundle))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return PREFIX + b64;
}

function isNoteShareBundle(v: unknown): v is NoteShareBundle {
  if (!v || typeof v !== 'object') return false;
  const b = v as NoteShareBundle;
  return b.v === 1 && Array.isArray(b.notes);
}

function isCustomerNote(v: unknown): v is CustomerNote {
  if (!v || typeof v !== 'object') return false;
  const n = v as CustomerNote;
  return (
    typeof n.id === 'string' &&
    typeof n.date === 'string' &&
    typeof n.customerName === 'string' &&
    Array.isArray(n.tags) &&
    typeof n.memo === 'string' &&
    typeof n.authorId === 'string' &&
    typeof n.authorName === 'string' &&
    typeof n.createdAt === 'string'
  );
}

export function parseShareInput(raw: string): CustomerNote[] {
  const text = raw.trim();
  if (!text) throw new Error('내용이 비어 있습니다.');

  if (text.startsWith(PREFIX)) {
    const b64 = text
      .slice(PREFIX.length)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const bundle = JSON.parse(base64ToUtf8(b64 + pad)) as unknown;
    if (!isNoteShareBundle(bundle)) throw new Error('전송 코드 형식이 올바르지 않습니다.');
    return bundle.notes.filter(isCustomerNote);
  }

  const parsed = JSON.parse(text) as unknown;
  if (isNoteShareBundle(parsed)) return parsed.notes.filter(isCustomerNote);
  if (Array.isArray(parsed)) return parsed.filter(isCustomerNote);
  throw new Error('인식할 수 없는 형식입니다.');
}

export function mergeNotes(existing: CustomerNote[], incoming: CustomerNote[]) {
  const byId = new Map(existing.map((n) => [n.id, n]));
  let added = 0;
  let skipped = 0;

  for (const note of incoming) {
    if (byId.has(note.id)) {
      skipped++;
      continue;
    }
    byId.set(note.id, note);
    added++;
  }

  const notes = [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { notes, added, skipped };
}

export function downloadShareFile(notes: CustomerNote[], authorName: string) {
  const bundle = createShareBundle(notes);
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `고객노트_${authorName}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareNotesFile(notes: CustomerNote[], authorName: string) {
  const bundle = createShareBundle(notes);
  const json = JSON.stringify(bundle);
  const filename = `고객노트_${authorName}_${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([json], filename, { type: 'application/json' });

  if (navigator.share) {
    try {
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '고객노트 전송',
          text: `${authorName} 고객노트 ${notes.length}건`,
        });
        return 'shared' as const;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled' as const;
    }
  }

  downloadShareFile(notes, authorName);
  return 'downloaded' as const;
}

export async function copyShareCode(notes: CustomerNote[]) {
  const code = encodeShareCode(createShareBundle(notes));
  await navigator.clipboard.writeText(code);
  return code;
}
