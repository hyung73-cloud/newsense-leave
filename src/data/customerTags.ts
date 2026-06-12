export const CUSTOMER_TAGS = [
  '비만',
  '피부',
  '탈모',
  '처방',
  '수액',
  '성형',
  '레이저',
  '남성',
  '여성',
  '20대',
  '30대',
  '40대',
  '50대',
  '일본',
  '중국',
  'VIP',
  '소개환자',
  '재방문확실',
  '예약예정',
  '관심환자',
] as const;

export type CustomerTag = (typeof CUSTOMER_TAGS)[number];
