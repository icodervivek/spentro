'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Home, ScrollText, LogOut, ChevronRight } from 'lucide-react';
import { AdminUser, clearAuth, getUser } from '@/lib/auth';
import clsx from 'clsx';
import { BrandLogo } from '@/components/BrandLogo';

const NAV = [
  { href: '/dashboard',            label: 'Overview',    icon: LayoutDashboard },
  { href: '/dashboard/users',      label: 'Users',       icon: Users },
  { href: '/dashboard/groups',     label: 'Groups',      icon: Home },
  { href: '/dashboard/audit-logs', label: 'Audit Logs',  icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.replace('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-primary-800 flex flex-col z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-primary-700">
        <BrandLogo size="sm" showText />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-primary-200 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-primary-700">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{user.name}</p>
              <p className="text-primary-300 text-xs truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-200 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
