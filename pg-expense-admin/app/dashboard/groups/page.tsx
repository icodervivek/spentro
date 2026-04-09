'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Spinner } from '@/components/Spinner';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function GroupsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-groups', page],
    queryFn: () => adminApi.groups({ page, limit: 15 }),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Groups</h1>
        <p className="text-sm text-slate-500 mt-1">All PG groups across the platform</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Group</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Created By</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Members</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Invite Code</th>
                  <th className="text-left px-5 py-3.5 font-700 text-xs text-slate-500 uppercase tracking-wide">Created</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.groups ?? []).map((g: any) => (
                  <tr key={g._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-700 text-slate-800">{g.name}</p>
                      {g.description && <p className="text-xs text-slate-400 truncate max-w-48">{g.description}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-600 text-slate-700">{g.createdBy?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{g.createdBy?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-700 text-slate-700">{g.members?.length ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <Badge label={g.isActive ? 'Active' : 'Inactive'} variant={g.isActive ? 'green' : 'red'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <code className="text-xs font-800 bg-slate-100 px-2 py-1 rounded-lg tracking-widest text-slate-600">
                        {g.inviteCode}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(g.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/dashboard/groups/${g._id}`}
                        className="inline-flex items-center gap-1 text-primary-700 hover:text-primary-800 text-xs font-700 transition"
                      >
                        View <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {(data?.groups ?? []).length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">No groups found</td></tr>
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
