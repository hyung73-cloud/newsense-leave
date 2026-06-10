export type WorkType = 'annual' | 'half_am' | 'half_pm' | 'hourly';
export type RequestStatus = 'requested' | 'approved' | 'rejected' | 'revise';

export interface Employee {
  id: string;
  name: string;
  role: string;
  isJapaneseAvailable: boolean;
  isActive: boolean;
  annualDays: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  date: string;
  type: WorkType;
  startTime: string;
  endTime: string;
  reason: string;
  status: RequestStatus;
  managerMemo: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  employees: Employee[];
  requests: LeaveRequest[];
}
