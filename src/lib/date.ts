export const pad = (n: number) => String(n).padStart(2, '0');

export const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

export const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

export const weekdayOf = (y: number, m: number, d: number) => new Date(y, m - 1, d).getDay();

export const WD_KR = ['일', '월', '화', '수', '목', '금', '토'];

export function monthsFrom(date: Date, n: number) {
  const arr: { y: number; m: number }[] = [];
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  for (let i = 0; i < n; i++) {
    arr.push({ y, m });
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return arr;
}
