'use client';

import { Bell, Settings, Search } from 'lucide-react';
import type { ReactNode } from 'react';

interface TopbarProps {
  crumbs: string[];
  right?: ReactNode;
}

export function Topbar({ crumbs, right }: TopbarProps) {
  return (
    <header
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 28px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'saturate(1.1) blur(6px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-3)' }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <span style={{ opacity: 0.4 }}>/</span>}
            {i === crumbs.length - 1
              ? <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{c}</strong>
              : <span>{c}</span>}
          </span>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 10px', width: 260,
            border: '1px solid var(--border)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--ink-3)', fontSize: 13,
          }}
        >
          <Search size={13} />
          <input
            placeholder="Search matches, teams, players…"
            style={{ border: 0, outline: 0, background: 'transparent', width: '100%', fontSize: 13, color: 'var(--ink)' }}
          />
          <kbd
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-3)',
              padding: '1px 5px', borderRadius: 4,
              background: 'var(--bg-sunken)', border: '1px solid var(--border)',
            }}
          >
            ⌘K
          </kbd>
        </div>
        {right}
        <IconBtn title="Notifications"><Bell size={15} /></IconBtn>
        <IconBtn title="Settings"><Settings size={15} /></IconBtn>
      </div>
    </header>
  );
}

function IconBtn({ children, title }: { children: ReactNode; title: string }) {
  return (
    <button
      title={title}
      style={{
        width: 30, height: 30, borderRadius: 7,
        display: 'grid', placeItems: 'center',
        color: 'var(--ink-2)', border: '1px solid transparent',
        background: 'none', cursor: 'pointer',
        transition: 'all 160ms cubic-bezier(0.2, 0.6, 0.2, 1)',
      }}
      className="hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]"
    >
      {children}
    </button>
  );
}
