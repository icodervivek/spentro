'use client';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { Spinner } from '@/components/Spinner';
import { StatCard } from '@/components/StatCard';
import { ArrowLeft, Receipt, IndianRupee, Users } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const fmt = (paise: number) =>
  '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtDate = (date?: string | Date) =>
  date
    ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const categoryLabel = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Other';

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const groupId = typeof params?.id === 'string' ? params.id : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-group', groupId],
    queryFn: () => adminApi.groupDetail(groupId!),
    enabled: !!groupId,
  });

  if (!groupId || isLoading) return <Spinner />;

  const { group, stats, transactions, balances } = data ?? {};
  const expenses = transactions?.expenses ?? [];
  const settlements = transactions?.settlements ?? [];
  const owes = balances?.owes ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Back */}
      <Link href="/dashboard/groups" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-700 font-600 mb-6 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{group?.name}</h1>
          {group?.description && <p className="text-slate-500 text-sm mt-1">{group.description}</p>}
          {group?.address && <p className="text-slate-400 text-xs mt-0.5">📍 {group.address}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge label={group?.isActive ? 'Active' : 'Inactive'} variant={group?.isActive ? 'green' : 'red'} />
          <code className="text-xs font-800 bg-slate-100 px-2.5 py-1 rounded-lg tracking-widest text-slate-600">
            {group?.inviteCode}
          </code>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Expenses" value={stats?.expenseCount ?? 0}    icon={Receipt}      color="teal" />
        <StatCard label="Amount Tracked" value={fmt(stats?.totalAmount ?? 0)} icon={IndianRupee}  color="rose" />
        <StatCard label="Members"         value={stats?.memberCount ?? 0}    icon={Users}        color="indigo" />
      </div>

      {/* Created by */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <h2 className="text-xs font-800 text-slate-500 uppercase tracking-wide mb-3">Created By</h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-800 text-sm">
            {group?.createdBy?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-700 text-slate-800">{group?.createdBy?.name}</p>
            <p className="text-sm text-slate-500">{group?.createdBy?.email}</p>
          </div>
          <div className="ml-auto text-xs text-slate-400">
            {group?.createdAt && new Date(group.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-xs font-800 text-slate-500 uppercase tracking-wide">
            Members ({group?.members?.length ?? 0})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50">
              <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Member</th>
              <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(group?.members ?? []).map((m: any) => (
              <tr key={m.user._id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 text-xs font-800 shrink-0">
                      {m.user.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-700 text-slate-800">{m.user.name}</p>
                      <p className="text-xs text-slate-400">{m.user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <Badge label={m.isAdmin ? 'Admin' : 'Member'} variant={m.isAdmin ? 'blue' : 'slate'} />
                </td>
                <td className="px-5 py-3.5">
                  <Badge label={m.user.status ?? 'active'} variant={m.user.status === 'suspended' ? 'red' : 'green'} />
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-400">
                  {m.joinedAt && new Date(m.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Owes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-xs font-800 text-slate-500 uppercase tracking-wide">
            Who Owes Whom ({owes.length})
          </h2>
        </div>
        {owes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No outstanding balances</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50">
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">From</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">To</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {owes.map((o: any, i: number) => (
                <tr key={`${o.from}-${o.to}-${i}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-600 text-slate-800">{o.fromUser?.name ?? o.from?.name ?? 'Unknown'}</td>
                  <td className="px-5 py-3.5 font-600 text-slate-800">{o.toUser?.name ?? o.to?.name ?? 'Unknown'}</td>
                  <td className="px-5 py-3.5 font-700 text-slate-800">{fmt(o.amount)}</td>
                  <td className="px-5 py-3.5"><Badge label="Owes" variant="amber" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Expense Transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-xs font-800 text-slate-500 uppercase tracking-wide">
            Expense Transactions ({expenses.length})
          </h2>
        </div>
        {expenses.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No expenses in this group yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-50 bg-slate-50">
                  <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Date</th>
                  <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Paid By</th>
                  <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Split</th>
                  <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {expenses.map((e: any) => (
                  <tr key={e._id} className="hover:bg-slate-50 transition-colors align-top">
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(e.date || e.createdAt)}</td>
                    <td className="px-5 py-3.5 font-600 text-slate-800">{e.paidBy?.name ?? 'Unknown'}</td>
                    <td className="px-5 py-3.5"><Badge label={categoryLabel(e.category)} variant="slate" /></td>
                    <td className="px-5 py-3.5 font-700 text-slate-800">{fmt(e.amount)}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {(e.splitAmong ?? []).map((s: any, idx: number) => (
                        <div key={`${e._id}-split-${idx}`} className="whitespace-nowrap">
                          {(s.user?.name ?? 'Unknown')}: {fmt(s.share)}
                        </div>
                      ))}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{e.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Settlement Transactions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-xs font-800 text-slate-500 uppercase tracking-wide">
            Settlement Transactions ({settlements.length})
          </h2>
        </div>
        {settlements.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No settlements recorded yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50">
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">From</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">To</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Method</th>
                <th className="text-left px-5 py-3 font-700 text-xs text-slate-400 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {settlements.map((s: any) => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-600">{fmtDate(s.createdAt)}</td>
                  <td className="px-5 py-3.5 font-600 text-slate-800">{s.fromUser?.name ?? 'Unknown'}</td>
                  <td className="px-5 py-3.5 font-600 text-slate-800">{s.toUser?.name ?? 'Unknown'}</td>
                  <td className="px-5 py-3.5 font-700 text-slate-800">{fmt(s.amount)}</td>
                  <td className="px-5 py-3.5 text-slate-600 uppercase">{s.method ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <Badge
                      label={s.status === 'confirmed' ? 'Settled' : s.status === 'pending' ? 'Pending' : 'Rejected'}
                      variant={s.status === 'confirmed' ? 'green' : s.status === 'pending' ? 'amber' : 'red'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
