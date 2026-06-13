import { CUSTOMER_TAG_GROUPS } from '../data/customerTags';

interface TagSelectProps {
  tags: string[];
  onToggle: (value: string) => void;
  size?: 'md' | 'sm';
}

export function TagSelect({ tags, onToggle, size = 'md' }: TagSelectProps) {
  const btn =
    size === 'sm'
      ? 'rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95'
      : 'rounded-full px-4 py-2.5 text-sm font-medium transition active:scale-95';

  return (
    <div className="space-y-4">
      {CUSTOMER_TAG_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-xs font-semibold text-slate-500">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.tags.map((tag) => {
              const on = tags.includes(tag.value);
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => onToggle(tag.value)}
                  className={`${btn} ${
                    on
                      ? 'bg-[#FEE500] text-[#3B1E1E] shadow-sm'
                      : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
