import type { AppState, Employee, LeaveRequest } from '../types';
import { store } from './store';
import { isSupabaseEnabled, supabase } from './supabase';

type EmployeeRow = {
  id: string;
  name: string;
  role: string;
  pin: string;
  is_japanese_available: boolean;
  is_active: boolean;
  annual_days: number;
};

type LeaveRequestRow = {
  id: string;
  employee_id: string;
  date: string;
  type: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: string;
  manager_memo: string;
  created_at: string;
  updated_at: string;
};

const DEFAULT_PINS: Record<string, string> = {
  e1: '1234',
  e2: '5678',
  e3: '9012',
};

function defaultEmployees(): Employee[] {
  return [
    { id: 'e1', name: '시0리', role: '직원', pin: '1234', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
    { id: 'e2', name: '이0지', role: '직원', pin: '5678', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
    { id: 'e3', name: '한0리', role: '직원', pin: '9012', isJapaneseAvailable: false, isActive: true, annualDays: 10.5 },
  ];
}

function withPins(employees: Employee[]): Employee[] {
  return employees.map((e, i) => ({
    ...e,
    pin: e.pin || DEFAULT_PINS[e.id] || String(1000 + i).slice(-4),
  }));
}

function employeeFromRow(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    pin: row.pin,
    isJapaneseAvailable: row.is_japanese_available,
    isActive: row.is_active,
    annualDays: Number(row.annual_days),
  };
}

function employeeToRow(emp: Employee): EmployeeRow {
  return {
    id: emp.id,
    name: emp.name,
    role: emp.role,
    pin: emp.pin,
    is_japanese_available: emp.isJapaneseAvailable,
    is_active: emp.isActive,
    annual_days: emp.annualDays,
  };
}

function requestFromRow(row: LeaveRequestRow): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date,
    type: row.type as LeaveRequest['type'],
    startTime: row.start_time,
    endTime: row.end_time,
    reason: row.reason,
    status: row.status as LeaveRequest['status'],
    managerMemo: row.manager_memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requestToRow(req: LeaveRequest): LeaveRequestRow {
  return {
    id: req.id,
    employee_id: req.employeeId,
    date: req.date,
    type: req.type,
    start_time: req.startTime,
    end_time: req.endTime,
    reason: req.reason,
    status: req.status,
    manager_memo: req.managerMemo,
    created_at: req.createdAt,
    updated_at: req.updatedAt,
  };
}

async function loadFromDb(): Promise<AppState> {
  if (!supabase) throw new Error('DB가 설정되지 않았습니다.');

  const [empRes, reqRes] = await Promise.all([
    supabase.from('employees').select('*').order('id'),
    supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
  ]);

  if (empRes.error) throw new Error(empRes.error.message);
  if (reqRes.error) throw new Error(reqRes.error.message);

  let employees = withPins((empRes.data as EmployeeRow[]).map(employeeFromRow));
  const requests = (reqRes.data as LeaveRequestRow[]).map(requestFromRow);

  if (employees.length === 0) {
    employees = defaultEmployees();
    const { error } = await supabase.from('employees').insert(employees.map(employeeToRow));
    if (error) throw new Error(error.message);
  }

  return { employees, requests };
}

async function syncEmployees(employees: Employee[]) {
  if (!supabase) return;
  const ids = new Set(employees.map((e) => e.id));
  const { data: existing, error: loadErr } = await supabase.from('employees').select('id');
  if (loadErr) throw new Error(loadErr.message);

  const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !ids.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase.from('employees').delete().in('id', toDelete);
    if (error) throw new Error(error.message);
  }
  if (employees.length > 0) {
    const { error } = await supabase.from('employees').upsert(employees.map(employeeToRow));
    if (error) throw new Error(error.message);
  }
}

async function syncRequests(requests: LeaveRequest[]) {
  if (!supabase) return;
  const ids = new Set(requests.map((r) => r.id));
  const { data: existing, error: loadErr } = await supabase.from('leave_requests').select('id');
  if (loadErr) throw new Error(loadErr.message);

  const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !ids.has(id));
  if (toDelete.length > 0) {
    const { error } = await supabase.from('leave_requests').delete().in('id', toDelete);
    if (error) throw new Error(error.message);
  }
  if (requests.length > 0) {
    const { error } = await supabase.from('leave_requests').upsert(requests.map(requestToRow));
    if (error) throw new Error(error.message);
  }
}

export const leaveApi = {
  usesDb: isSupabaseEnabled,

  async load(): Promise<AppState> {
    if (!isSupabaseEnabled) return store.load();
    return loadFromDb();
  },

  async save(employees: Employee[], requests: LeaveRequest[]) {
    if (!isSupabaseEnabled) {
      store.save({ employees, requests });
      return;
    }
    await syncEmployees(employees);
    await syncRequests(requests);
  },
};
