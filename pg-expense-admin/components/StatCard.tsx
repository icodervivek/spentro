import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'teal' | 'indigo' | 'amber' | 'rose';
}

const colorMap = {
  teal:   { bg: 'bg-primary-50',  icon: 'bg-primary-100 text-primary-700', border: 'border-primary-100' },
  indigo: { bg: 'bg-indigo-50',   icon: 'bg-indigo-100 text-indigo-700',   border: 'border-indigo-100' },
  amber:  { bg: 'bg-amber-50',    icon: 'bg-amber-100 text-amber-700',     border: 'border-amber-100' },
  rose:   { bg: 'bg-rose-50',     icon: 'bg-rose-100 text-rose-700',       border: 'border-rose-100' },
};

export function StatCard({ label, value, icon: Icon, trend, trendUp, color = 'teal' }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={clsx('rounded-2xl border p-5 flex items-start gap-4', c.bg, c.border)}>
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', c.icon)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-700 text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-slate-800 mt-0.5">{value}</p>
        {trend && (
          <p className={clsx('text-xs font-600 mt-1', trendUp ? 'text-emerald-600' : 'text-slate-400')}>
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}
