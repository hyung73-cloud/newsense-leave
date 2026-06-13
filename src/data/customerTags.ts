export type CustomerTagDef = {
  value: string;
  label: string;
};

export type CustomerTagGroup = {
  label: string;
  tags: readonly CustomerTagDef[];
};

export const CUSTOMER_TAG_GROUPS: readonly CustomerTagGroup[] = [
  {
    label: '국적/언어',
    tags: [
      { value: '일본', label: '일본' },
      { value: '한국', label: '한국' },
      { value: '중국', label: '중국' },
      { value: '미국/영어권', label: '미국/영어권' },
      { value: '기타(국적)', label: '기타' },
    ],
  },
  {
    label: '관심분야',
    tags: [
      { value: '색소', label: '색소' },
      { value: '리프팅', label: '리프팅' },
      { value: '성형', label: '성형' },
      { value: '쁘띠시술', label: '쁘띠시술' },
      { value: '비만', label: '비만' },
      { value: '기타(관심)', label: '기타' },
    ],
  },
  {
    label: '관계상태',
    tags: [
      { value: '예약예정', label: '예약예정' },
      { value: '재방문확실', label: '재방문확실' },
      { value: '관심환자', label: '관심환자' },
      { value: '소개환자', label: '소개환자' },
      { value: 'VIP', label: 'VIP' },
    ],
  },
] as const;

const labelByValue = new Map(
  CUSTOMER_TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t.value, t.label] as const)),
);

/** 저장값 → 화면 표시 (예: 기타(국적) → 기타) */
export function formatTagLabel(value: string) {
  return labelByValue.get(value) ?? value;
}

export const CUSTOMER_TAGS = CUSTOMER_TAG_GROUPS.flatMap((g) =>
  g.tags.map((t) => t.value),
) as readonly string[];

export type CustomerTag = (typeof CUSTOMER_TAGS)[number];
