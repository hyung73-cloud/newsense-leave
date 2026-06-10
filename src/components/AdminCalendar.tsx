import { useState } from 'react';
import type { Employee, LeaveRequest } from '../types';
import { MiniCalendars } from './MiniCalendars';

interface AdminCalendarProps {
  actives: Employee[];
  requests: LeaveRequest[];
  empById: Record<string, Employee>;
}

export function AdminCalendar({ actives, requests, empById }: AdminCalendarProps) {
  const [sel, setSel] = useState('all');
  const filtered = sel === 'all' ? requests : requests.filter((r) => r.employeeId === sel);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-slate-500">보기</label>
        <select
          value={sel}
          onChange={(e) => setSel(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">전체 직원</option>
          {actives.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">⚠️ 같은 날 2명 이상 부재 시 표시</span>
      </div>
      <MiniCalendars requests={filtered} empById={empById} showNames={sel === 'all'} />
    </div>
  );
}
