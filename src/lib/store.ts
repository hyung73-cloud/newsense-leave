import type { AppState, Employee } from '../types';

const DATA_VERSION = '4';
const KEYS = { version: 'nsc_ver', emp: 'nsc_emp', req: 'nsc_req' };

const DEFAULT_PINS: Record<string, string> = {
  e1: '1234',
  e2: '5678',
  e3: '9012',
};

function seed(): AppState {
  const employees: Employee[] = [
    { id: 'e1', name: '시0리', role: '직원', pin: '1234', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
    { id: 'e2', name: '이0지', role: '직원', pin: '5678', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
    { id: 'e3', name: '한0리', role: '직원', pin: '9012', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
  ];

  return { employees, requests: [] };
}

function withPins(employees: Employee[]): Employee[] {
  return employees.map((e, i) => ({
    ...e,
    pin: e.pin || DEFAULT_PINS[e.id] || String(1000 + i).slice(-4),
  }));
}

export const store = {
  load(): AppState {
    const ver = localStorage.getItem(KEYS.version);
    const e = localStorage.getItem(KEYS.emp);
    const r = localStorage.getItem(KEYS.req);
    if (ver === DATA_VERSION && e && r) {
      return { employees: withPins(JSON.parse(e)), requests: JSON.parse(r) };
    }
    if (e && r && ver !== DATA_VERSION) {
      const migrated = { employees: withPins(JSON.parse(e)), requests: JSON.parse(r) };
      this.save(migrated);
      localStorage.setItem(KEYS.version, DATA_VERSION);
      return migrated;
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
