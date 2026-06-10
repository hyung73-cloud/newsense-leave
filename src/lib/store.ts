import { monthsFrom, ymd } from './date';
import type { AppState, Employee, LeaveRequest, RequestStatus, WorkType } from '../types';

const KEYS = { emp: 'nsc_emp', req: 'nsc_req' };

function seed(): AppState {
  const next = monthsFrom(new Date(), 2)[1];
  const D = (d: number) => ymd(next.y, next.m, d);
  const now = new Date().toISOString();
  const r = (
    id: string,
    employeeId: string,
    date: string,
    type: WorkType,
    status: RequestStatus,
    extra: Partial<LeaveRequest> = {},
  ): LeaveRequest => ({
    id,
    employeeId,
    date,
    type,
    status,
    startTime: '',
    endTime: '',
    reason: '',
    managerMemo: '',
    createdAt: now,
    updatedAt: now,
    ...extra,
  });

  const employees: Employee[] = [
    { id: 'e1', name: '김지은', role: '접수', isJapaneseAvailable: false, isActive: true, annualDays: 15 },
    { id: 'e2', name: '박서연', role: '간호', isJapaneseAvailable: false, isActive: true, annualDays: 15 },
    { id: 'e3', name: '이하루', role: '상담', isJapaneseAvailable: true, isActive: true, annualDays: 15 },
    { id: 'e4', name: '최민수', role: '시술보조', isJapaneseAvailable: false, isActive: true, annualDays: 12 },
    { id: 'e5', name: '정유진', role: '간호', isJapaneseAvailable: true, isActive: true, annualDays: 15 },
  ];

  const requests: LeaveRequest[] = [
    r('s1', 'e1', D(6), 'annual', 'approved', { reason: '여행' }),
    r('s2', 'e1', D(7), 'annual', 'approved'),
    r('s3', 'e1', D(13), 'annual', 'approved'),
    r('s4', 'e1', D(20), 'annual', 'requested'),
    r('s5', 'e1', D(21), 'half_am', 'approved'),
    r('s6', 'e3', D(7), 'annual', 'requested'),
    r('s7', 'e3', D(14), 'hourly', 'approved', { startTime: '13:00', endTime: '15:00' }),
    r('s8', 'e2', D(7), 'half_pm', 'approved'),
    r('s9', 'e5', D(21), 'annual', 'requested'),
  ];

  return { employees, requests };
}

export const store = {
  load(): AppState {
    const e = localStorage.getItem(KEYS.emp);
    const r = localStorage.getItem(KEYS.req);
    if (e && r) {
      return { employees: JSON.parse(e), requests: JSON.parse(r) };
    }
    const init = seed();
    this.save(init);
    return init;
  },
  save(state: AppState) {
    localStorage.setItem(KEYS.emp, JSON.stringify(state.employees));
    localStorage.setItem(KEYS.req, JSON.stringify(state.requests));
  },
};
