import type { CustomerNote } from '../types';
import { customerNoteStore } from './customerNoteStore';
import { mergeNotes } from './noteTransfer';
import { isSupabaseEnabled, supabase } from './supabase';

type NoteRow = {
  id: string;
  date: string;
  customer_name: string;
  tags: string[];
  memo: string;
  author_id: string;
  author_name: string;
  author_pin_id: string;
  created_at: string;
};

function fromRow(row: NoteRow): CustomerNote {
  return {
    id: row.id,
    date: row.date,
    customerName: row.customer_name,
    tags: row.tags ?? [],
    memo: row.memo,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPinId: row.author_pin_id ?? '',
    createdAt: row.created_at,
  };
}

function toRow(note: CustomerNote): NoteRow {
  return {
    id: note.id,
    date: note.date,
    customer_name: note.customerName,
    tags: note.tags,
    memo: note.memo,
    author_id: note.authorId,
    author_name: note.authorName,
    author_pin_id: note.authorPinId,
    created_at: note.createdAt,
  };
}

function sortByNewest(notes: CustomerNote[]) {
  return [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function loadFromDb(): Promise<CustomerNote[]> {
  if (!supabase) throw new Error('DB가 설정되지 않았습니다.');
  const { data, error } = await supabase
    .from('customer_notes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return sortByNewest((data as NoteRow[]).map(fromRow));
}

export const customerNoteApi = {
  usesDb: isSupabaseEnabled,

  async loadAll(): Promise<CustomerNote[]> {
    if (!isSupabaseEnabled) return customerNoteStore.load();
    return loadFromDb();
  },

  async add(note: CustomerNote): Promise<CustomerNote[]> {
    if (!isSupabaseEnabled) return customerNoteStore.add(note);
    const { error } = await supabase!.from('customer_notes').insert(toRow(note));
    if (error) throw new Error(error.message);
    return loadFromDb();
  },

  async update(
    id: string,
    patch: Partial<Pick<CustomerNote, 'date' | 'customerName' | 'tags' | 'memo'>>,
  ): Promise<CustomerNote[]> {
    if (!isSupabaseEnabled) return customerNoteStore.update(id, patch);
    const row: Partial<NoteRow> = {};
    if (patch.date !== undefined) row.date = patch.date;
    if (patch.customerName !== undefined) row.customer_name = patch.customerName;
    if (patch.tags !== undefined) row.tags = patch.tags;
    if (patch.memo !== undefined) row.memo = patch.memo;
    const { error } = await supabase!.from('customer_notes').update(row).eq('id', id);
    if (error) throw new Error(error.message);
    return loadFromDb();
  },

  async remove(id: string): Promise<CustomerNote[]> {
    if (!isSupabaseEnabled) return customerNoteStore.remove(id);
    const { error } = await supabase!.from('customer_notes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return loadFromDb();
  },

  async clear(): Promise<CustomerNote[]> {
    if (!isSupabaseEnabled) return customerNoteStore.clear();
    const { error } = await supabase!.from('customer_notes').delete().neq('id', '');
    if (error) throw new Error(error.message);
    return [];
  },

  async mergeImport(incoming: CustomerNote[]) {
    if (!isSupabaseEnabled) return customerNoteStore.mergeImport(incoming);
    const existing = await loadFromDb();
    const result = mergeNotes(existing, incoming);
    const toInsert = result.notes.filter((n) => !existing.some((e) => e.id === n.id));
    if (toInsert.length > 0) {
      const { error } = await supabase!.from('customer_notes').insert(toInsert.map(toRow));
      if (error) throw new Error(error.message);
    }
    return { ...result, notes: await loadFromDb() };
  },
};
