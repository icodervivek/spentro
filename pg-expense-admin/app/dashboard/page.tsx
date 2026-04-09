'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { Spinner } from '@/components/Spinner';
import {
  Users, Home, Receipt, IndianRupee, TrendingUp, Activity,
  UserCheck, HomeIcon, BarChart3, PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

const CATEGORY_COLORS: Record<string, string> = {
  rent: '#6366f1', food: '#f59e0b', utilities: '#10b981',
  groceries: '#3b82f6', transport: '#8b5cf6', entertainment: '#ec4899',
  maintenance: '#06b6d4', household: '#84cc16', other: '#6b7280',
};

const fmt = (paise: number) =>
  '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: adminApi.analytics,
  });

  if (isLoading) return <Spinner />;

  const inactiveGroups = (data?.totalGroups ?? 0) - (data?.activeGroups ?? 0);
  const inactiveUsers = Math.max((data?.totalUsers ?? 0) - (data?.activeUsers ?? 0), 0);
  const avgExpenseValue = (data?.totalExpenses ?? 0) > 0
    ? Math.round((data?.totalAmountTracked ?? 0) / data.totalExpenses)
    : 0;

  const cats = (data?.topCategories ?? []).map((c: any) => ({
    name: c._id.charAt(0).toUpperCase() + c._id.slice(1),
    total: Math.round(c.total / 100),
    count: c.count,
    key: c._id,
  }));

  const userMix = [
    { name: 'Active', value: data?.activeUsers ?? 0, color: '#10b981' },
    { name: 'Inactive', value: inactiveUsers, color: '#cbd5e1' },
  ];

  const groupMix = [
    { name: 'Active', value: data?.activeGroups ?? 0, color: '#3b82f6' },
    { name: 'Inactive', value: inactiveGroups, color: '#f59e0b' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Platform-wide metrics and spending analytics</p>
      </div>

      {/* ── Users + Finances ── */}
      <div>
        <SectionLabel>Users & Finances</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={data?.totalUsers ?? 0}
            icon={Users}
            color="teal"
            trend={`${data?.activeUsers ?? 0} active in last 30 days`}
            trendUp
          />
          <StatCard
            label="Active Users"
            value={data?.activeUsers ?? 0}
            icon={Activity}
            color="indigo"
            trend="Last 30 days"
            trendUp
          />
          <StatCard
            label="Total Expenses"
            value={data?.totalExpenses ?? 0}
            icon={Receipt}
            color="amber"
            trend={data?.totalGroups ? `${Math.round((data.totalExpenses ?? 0) / Math.max(data.totalGroups, 1))} avg per group` : undefined}
          />
          <StatCard
            label="Total Amount Tracked"
            value={fmt(data?.totalAmountTracked ?? 0)}
            icon={IndianRupee}
            color="rose"
            trend={avgExpenseValue ? `Avg expense ${fmt(avgExpenseValue)}` : 'No expenses yet'}
            trendUp={avgExpenseValue > 0}
          />
        </div>
      </div>

      {/* ── Groups ── */}
      <div>
        <SectionLabel>Groups</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Groups"
            value={data?.totalGroups ?? 0}
            icon={Home}
            color="indigo"
          />
          <StatCard
            label="Active Groups"
            value={data?.activeGroups ?? 0}
            icon={TrendingUp}
            color="teal"
            trend={`${Math.round(((data?.activeGroups ?? 0) / Math.max(data?.totalGroups ?? 1, 1)) * 100)}% of all groups`}
            trendUp
          />
          <StatCard
            label="Inactive Groups"
            value={inactiveGroups}
            icon={HomeIcon}
            color="amber"
            trend={inactiveGroups > 0 ? 'May need attention' : 'All groups active'}
            trendUp={inactiveGroups === 0}
          />
        </div>
      </div>

      {/* ── Charts ── */}
      <div>
        <SectionLabel>Spending Breakdown</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Top Categories (All Time)
              </h2>
            </div>
            {cats.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No expense data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cats} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {cats.map((c: any) => (
                      <Cell key={c.key} fill={CATEGORY_COLORS[c.key] ?? '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Category Breakdown
              </h2>
            </div>
            {cats.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No data</p>
            ) : (
              <div className="space-y-4">
                {(data?.topCategories ?? []).map((c: any) => {
                  const max = data.topCategories[0]?.total ?? 1;
                  const pct = Math.round((c.total / max) * 100);
                  const color = CATEGORY_COLORS[c._id] ?? '#6b7280';
                  return (
                    <div key={c._id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm font-semibold text-slate-700 capitalize">{c._id}</span>
                          <span className="text-xs text-slate-400">({c.count} expenses)</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{fmt(c.total)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Additional Insights ── */}
      <div>
        <SectionLabel>Platform Insights</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <PieChartIcon className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                User Activity Mix
              </h2>
            </div>
            {(data?.totalUsers ?? 0) === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No users yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={userMix} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2}>
                    {userMix.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Users']} />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <PieChartIcon className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Group Health Mix
              </h2>
            </div>
            {(data?.totalGroups ?? 0) === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No groups yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={groupMix} dataKey="value" nameKey="name" innerRadius={54} outerRadius={78} paddingAngle={2}>
                    {groupMix.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Groups']} />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                Category by Count
              </h2>
            </div>
            {cats.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No expense data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cats} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v, 'Expenses']} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {cats.map((c: any) => (
                      <Cell key={c.key} fill={CATEGORY_COLORS[c.key] ?? '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
