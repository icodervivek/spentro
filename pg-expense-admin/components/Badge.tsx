import clsx from 'clsx';

type Variant = 'green' | 'red' | 'amber' | 'blue' | 'slate';

const variants: Record<Variant, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  red:   'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue:  'bg-blue-100 text-blue-700',
  slate: 'bg-slate-100 text-slate-600',
};

export function Badge({ label, variant = 'slate' }: { label: string; variant?: Variant }) {
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-700 tracking-wide', variants[variant])}>
      {label}
    </span>
  );
}
