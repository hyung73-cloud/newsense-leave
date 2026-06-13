export { isSupabaseEnabled as usesDb } from './supabase';

export function storageHint(section: 'leave' | 'notes') {
  if (section === 'leave') {
    return '환산: 반차 2 = 연차 1 · 시간차 4 = 반차 1 · 시간차 8 = 연차 1';
  }
  return '태그 = 통계·검색용 · 메모 = 상담 기록';
}
