import type { AppState, Employee } from '../types';

const DATA_VERSION = '3';
const KEYS = { version: 'nsc_ver', emp: 'nsc_emp', req: 'nsc_req' };

function seed(): AppState {
  // 연차 10 + 반차 1 = 84 unit → 부여 10.5일, 신청 없음
  const employees: Employee[] = [
    { id: 'e1', name: '시0리', role: '직원', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
    { id: 'e2', name: '이0지', role: '직원', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
    { id: 'e3', name: '한0리', role: '직원', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
  ];

  return { employees, requests: [] };
}

export const store = {
  load(): AppState {
    const ver = localStorage.getItem(KEYS.version);
    const e = localStorage.getItem(KEYS.emp);
    const r = localStorage.getItem(KEYS.req);
    if (ver === DATA_VERSION && e && r) {
      return { employees: JSON.parse(e), requests: JSON.parse(r) };
    }
    const init = seed();
    this.save(init);
    localStorage.setItem(KEYS.version, DATA_VERSION);
    return init;
  },
  save(state: AppState) {
    localStorage.setItem(KEYS.emp, JSON.stringify(state.employees));
    localStorage.setItem(KEYS.req, JSON.stringify(state.requests));
    localStorage.setItem(KEYS.version, DATA_VERSION);
  },
};
