import { useState } from 'react';
import { REQ_STATUS, TYPES } from '../lib/leave';
import type { Employee, LeaveRequest, RequestStatus } from '../types';
import { Badge } from './Badge';

interface ApprovePanelProps {
  requests: LeaveRequest[];
  empById: Record<string, Employee>;
  updateRequests: (fn: (prev: LeaveRequest[]) => LeaveRequest[]) => void;
}

export function ApprovePanel({ requests, empById, updateRequests }: ApprovePanelProps) {
  const [filter, setFilter] = useState<RequestStatus | 'all'>('requested');
  const list = requests
    .filter((r) => (filter === 'all' ? true : r.status === filter))
    .sort((a, b) => a.date.localeCompare(b.date));

  const setStatus = (id: string, status: RequestStatus) =>
    updateRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r,
      ),
    );

  const setMemo = (id: string, v: string) =>
    updateRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, managerMemo: v } : r)),
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">승인 관리</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as RequestStatus | 'all')}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
        >
          <option value="requested">대기</option>
          <option value="approved">승인</option>
          <option value="revise">수정요청</option>
          <option value="rejected">반려</option>
          <option value="all">전체</option>
        </select>
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">해당 신청 없음</p>
      ) : (
        <ul className="space-y-2.5">
          {list.map((r) => {
            const t = TYPES[r.type];
            const s = REQ_STATUS[r.status];
            return (
              <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{r.date.slice(5)}</span>
                  <span className="text-sm font-medium">{empById[r.employeeId]?.name}</span>
                  <Badge cls={t.cls}>
                    {t.label}
                    {r.type === 'hourly' && r.startTime ? ` ${r.startTime}~${r.endTime}` : ''}
                  </Badge>
                  <Badge cls={s.cls}>{s.label}</Badge>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={r.managerMemo}
                    onChange={(e) => setMemo(r.id, e.target.value)}
                    placeholder="관리자 메모"
                    className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setStatus(r.id, 'approved')}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(r.id, 'revise')}
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(r.id, 'rejected')}
                    className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-600"
                  >
                    반려
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
