import type { LeaveRequest, RequestStatus, WorkType } from '../types';

export const DAY_UNITS = 8;

export const TYPES: Record<
  WorkType,
  { label: string; short: string; unit: number; cls: string; btn: string }
> = {
  annual: {
    label: '연차',
    short: '연차',
    unit: 8,
    cls: 'bg-red-100 text-red-700 border-red-300',
    btn: 'bg-red-500 hover:bg-red-600',
  },
  half_am: {
    label: '오전반차',
    short: '오전',
    unit: 4,
    cls: 'bg-orange-100 text-orange-700 border-orange-300',
    btn: 'bg-orange-500 hover:bg-orange-600',
  },
  half_pm: {
    label: '오후반차',
    short: '오후',
    unit: 4,
    cls: 'bg-orange-100 text-orange-700 border-orange-300',
    btn: 'bg-orange-500 hover:bg-orange-600',
  },
  hourly: {
    label: '시간차',
    short: '시간',
    unit: 1,
    cls: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    btn: 'bg-yellow-500 hover:bg-yellow-600',
  },
};

export const TYPE_ORDER: WorkType[] = ['annual', 'half_am', 'half_pm', 'hourly'];

export const REQ_STATUS: Record<RequestStatus, { label: string; cls: string }> = {
  requested: { label: '신청', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: '승인', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '반려', cls: 'bg-rose-100 text-rose-700' },
  revise: { label: '수정요청', cls: 'bg-sky-100 text-sky-700' },
};

export const ACTIVE_STATUSES: RequestStatus[] = ['requested', 'approved', 'revise'];

export const ROLE_OPTIONS = ['직원', '접수', '간호', '상담', '시술보조', '기타'];

export function usedUnits(
  empId: string,
  requests: LeaveRequest[],
  statuses: RequestStatus[] = ACTIVE_STATUSES,
) {
  return requests
    .filter((r) => r.employeeId === empId && statuses.includes(r.status))
    .reduce((a, r) => a + (TYPES[r.type]?.unit || 0), 0);
}

export function decompose(units: number) {
  let u = Math.max(0, units);
  const annual = Math.floor(u / 8);
  u %= 8;
  const half = Math.floor(u / 4);
  u %= 4;
  return { annual, half, hourly: u };
}

export function countType(
  empId: string,
  type: WorkType,
  requests: LeaveRequest[],
  statuses: RequestStatus[] = ACTIVE_STATUSES,
) {
  return requests.filter(
    (r) => r.employeeId === empId && r.type === type && statuses.includes(r.status),
  ).length;
}
