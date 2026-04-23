'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Plus, Activity, Eye, Users, Trophy, Calendar, LogOut, UserCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

const mainNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/matches/new', label: 'New Match', icon: Plus },
  { href: '/scoring', label: 'Live Scoring', icon: Activity, badge: 'LIVE' },
  { href: '/matches', label: 'Matches', icon: Eye },
];

const manageNav = [
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/players', label: 'Players', icon: UserCircle },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/schedule', label: 'Fixtures', icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    authService.logout();
    clearAuth();
    toast.success('Logged out');
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside
      style={{
        background: 'var(--bg-sunken)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: 240,
        flexShrink: 0,
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 20px 16px' }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'var(--ink)', color: 'var(--bg)',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em',
          }}
        >
          C
        </div>
        <div style={{ fontWeight: 600, letterSpacing: '-0.02em', fontSize: 15 }}>
          CrickScore<span style={{ color: 'var(--ink-3)', fontWeight: 400 }}> / Ops</span>
        </div>
      </div>

      {/* Workspace section */}
      <SectionLabel>Workspace</SectionLabel>
      {mainNav.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          badge={item.badge}
          active={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
        />
      ))}

      {/* Manage section */}
      <SectionLabel>Manage</SectionLabel>
      {manageNav.map((item) => (
        <NavItem
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname.startsWith(item.href)}
        />
      ))}

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div
        style={{
          padding: 14,
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, oklch(70% 0.1 150), oklch(55% 0.13 220))',
            color: 'white', display: 'grid', placeItems: 'center',
            fontSize: 11, fontWeight: 600, flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.25, minWidth: 0, flex: 1 }}>
          <strong style={{ display: 'block', fontWeight: 600, color: 'var(--ink)' }}>
            {user?.name || 'User'}
          </strong>
          <span style={{ color: 'var(--ink-3)' }}>Scorer</span>
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          style={{
            width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center',
            color: 'var(--ink-3)', border: 'none', background: 'none', cursor: 'pointer',
          }}
          className="hover:bg-[var(--bg-hover)] hover:text-[var(--ink)] transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.09em',
        color: 'var(--ink-4)', padding: '14px 20px 6px', fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function NavItem({
  href, label, icon: Icon, badge, active,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', margin: '1px 10px',
        borderRadius: 'var(--radius-sm)',
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        fontSize: 13.5, fontWeight: 500,
        textDecoration: 'none',
        transition: 'background var(--duration) var(--ease), color var(--duration) var(--ease)',
        background: active ? 'var(--bg-elevated)' : 'transparent',
        boxShadow: active ? 'var(--shadow-sm)' : 'none',
        width: 'calc(100% - 20px)',
      }}
      className={cn(!active && 'hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]')}
    >
      <Icon size={16} style={{ opacity: 0.85, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span
          style={{
            fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 999,
            background: 'var(--danger)', color: 'white', letterSpacing: '0.02em',
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
