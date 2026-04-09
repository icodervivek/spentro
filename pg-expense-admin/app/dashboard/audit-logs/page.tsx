'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Pagination } from '@/components/Pagination';
import { Spinner } from '@/components/Spinner';
import { Badge } from '@/components/Badge';
import { Search, Filter } from 'lucide-react';

const ACTION_COLORS: Record<string, 'green' | 'red' | 'amber' | 'blue' | 'slate'> = {
  'expense.create':     'green',
  'expense.update':     'amber',
  'expense.delete':     'red',
  'settlement.create':  'blue',
  'settlement.confirm': 'green',
  'settlement.reject':  'red',
};

const actionVariant = (action: string) => ACTION_COLORS[action] ?? 'slate';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [groupIdFilter, setGroupIdFilter] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [groupIdInput, setGroupIdInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page, actionFilter, groupIdFilter, userIdFilter],
    queryFn: () => adminApi.auditLogs({
      page,
      action: actionFilter || undefined,
      groupId: groupIdFilter || undefined,
      userId: userIdFilter || undefined,
      limit: 25,
    }),
  });

  const hasFilters = actionFilter || groupIdFilter || userIdFilter;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActionFilter(actionInput);
    setGroupIdFilter(groupIdInput);
    setUserIdFilter(userIdInput);
    setPage(1);
  };

  const handleClear = () => {
    setActionFilter(''); setActionInput('');
    setGroupIdFilter(''); setGroupIdInput('');
    setUserIdFilter(''); setUserIdInput('');
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Every mutation recorded across the platform</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            placeholder="Action (e.g. expense.create)…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={groupIdInput}
            onChange={(e) => setGroupIdInput(e.target.value)}
            placeholder="Group ID…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="User ID…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-primary-700 text-white text-sm font-600 rounded-xl hover:bg-primary-800 transition">
          Filter
        </button>
        {hasFilters && (
          <button type="button" onClick={handleClear}
            className="px-3 py-2 text-sm font-600 text-slate-600 hover:bg-slate-100 rounded-xl transition">
            Clear
          </button>
        )}
      </form>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Performed By</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Group</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.logs ?? []).map((log: any) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Badge label={log.action} variant={actionVariant(log.action)} />
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-600 text-slate-800">{log.performedBy?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{log.performedBy?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-500">
                      {log.group?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-600 text-slate-500">{log.entityType}</span>
                      <p className="text-xs text-slate-300 font-mono mt-0.5 truncate max-w-28">{String(log.entityId).slice(-8)}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
                {(data?.logs ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">No logs found</td></tr>
                )}
              </tbody>
            </table>

            <div className="px-5 py-4">
              <Pagination
                page={data?.pagination?.page ?? 1}
                pages={data?.pagination?.pages ?? 1}
                total={data?.pagination?.total ?? 0}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
