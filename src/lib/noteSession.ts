export interface NoteSession {
  employeeId: string;
  employeeName: string;
  authorPinId: string;
  expiresAt: number;
}

const KEY = 'nsc_note_session';
const HOURS = 8;

export const noteSession = {
  load(): NoteSession | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      const s = JSON.parse(raw) as NoteSession;
      if (Date.now() > s.expiresAt) {
        this.clear();
        return null;
      }
      return s;
    } catch {
      return null;
    }
  },
  save(employeeId: string, employeeName: string, authorPinId: string): NoteSession {
    const s: NoteSession = {
      employeeId,
      employeeName,
      authorPinId,
      expiresAt: Date.now() + HOURS * 60 * 60 * 1000,
    };
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  },
  clear() {
    localStorage.removeItem(KEY);
  },
  remainingLabel(s: NoteSession) {
    const h = Math.max(0, Math.floor((s.expiresAt - Date.now()) / (60 * 60 * 1000)));
    return h > 0 ? `${h}시간` : '곧 만료';
  },
};

export function findByPin(employees: { id: string; name: string; pin: string; isActive: boolean }[], pin: string) {
  return employees.find((e) => e.isActive && e.pin === pin) ?? null;
}
