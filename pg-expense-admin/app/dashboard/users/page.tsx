'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Spinner } from '@/components/Spinner';
import { Search, UserCheck, UserX, AlertTriangle, X } from 'lucide-react';

interface ConfirmTarget {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currentStatus: 'active' | 'suspended';
}

function Avatar({
  name,
  avatarUrl,
  size = 'md',
}: {
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
}) {
  const [broken, setBroken] = useState(false);
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-xs';
  const initials = (name || 'U').slice(0, 2).toUpperCase();
  const showImage = !!avatarUrl && !broken;

  if (showImage) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${sizeClasses} rounded-full object-cover shrink-0 border border-slate-200`}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className={`${sizeClasses} rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0`}>
      {initials}
    </div>
  );
}

function ConfirmDialog({
  target,
  isPending,
  onConfirm,
  onCancel,
}: {
  target: ConfirmTarget;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isSuspending = target.currentStatus === 'active';

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top accent */}
        <div className={`h-1 w-full ${isSuspending ? 'bg-red-500' : 'bg-emerald-500'}`} />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isSuspending ? 'bg-red-50' : 'bg-emerald-50'}`}>
              {isSuspending
                ? <UserX className="w-5 h-5 text-red-600" />
                : <UserCheck className="w-5 h-5 text-emerald-600" />}
            </div>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg font-extrabold text-slate-800 mb-1">
            {isSuspending ? 'Suspend account?' : 'Activate account?'}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {isSuspending
              ? 'This will block the user from logging in and using the app.'
              : 'This will restore the user\'s access to the app.'}
          </p>

          {/* User info chip */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-6">
            <Avatar name={target.name} avatarUrl={target.avatarUrl} />
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{target.name}</p>
              <p className="text-xs text-slate-500 truncate">{target.email}</p>
            </div>
          </div>

          {isSuspending && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>The user will be immediately logged out and unable to sign back in.</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60 disabled:cursor-not-allowed ${
                isSuspending
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isPending
                ? (isSuspending ? 'Suspending…' : 'Activating…')
                : (isSuspending ? 'Yes, suspend' : 'Yes, activate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, status],
    queryFn: () => adminApi.users({ page, search: search || undefined, status: status || undefined, limit: 15 }),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'suspended' }) =>
      adminApi.updateUserStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setConfirmTarget(null);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openConfirm = (u: any) => {
    setConfirmTarget({
      id: u._id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      currentStatus: u.status,
    });
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    const next = confirmTarget.currentStatus === 'active' ? 'suspended' : 'active';
    updateStatus.mutate({ id: confirmTarget.id, status: next });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {confirmTarget && (
        <ConfirmDialog
          target={confirmTarget}
          isPending={updateStatus.isPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Users</h1>
        <p className="text-sm text-slate-500 mt-1">Manage all registered users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-64">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-700 text-white text-sm font-semibold rounded-xl hover:bg-primary-800 transition">
            Search
          </button>
        </form>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-5 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="text-right px-5 py-3.5 font-bold text-xs text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(data?.users ?? []).map((u: any) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} avatarUrl={u.avatarUrl} />
                        <div>
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={u.role} variant={u.role === 'admin' ? 'blue' : 'slate'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={u.status} variant={u.status === 'active' ? 'green' : 'red'} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => openConfirm(u)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            u.status === 'active'
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'active'
                            ? <><UserX className="w-3.5 h-3.5" /> Suspend</>
                            : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}

                {(data?.users ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">No users found</td></tr>
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
