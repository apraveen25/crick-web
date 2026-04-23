'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { matchService } from '@/services/match.service';
import { formatDate } from '@/utils/format';

export default function ScoringIndexPage() {
  const router = useRouter();
  const { data: liveMatches = [], isLoading } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: matchService.getLiveMatches,
    refetchInterval: 10000,
  });

  return (
    <>
      <Topbar crumbs={['CrickScore', 'Live Scoring']} />

      <div style={{ padding: '28px 32px 48px', maxWidth: 700 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>Live Scoring</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>Open an ongoing match to score ball-by-ball.</p>
        </div>

        {isLoading ? (
          <div style={{ height: 120, borderRadius: 'var(--radius)', background: 'var(--bg-sunken)' }} />
        ) : liveMatches.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No live matches"
            description="Start a match to begin scoring. Select teams, toss, and open the scoring console."
            action={{ label: 'New match', onClick: () => router.push('/matches/new') }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liveMatches.map((m) => (
              <div
                key={m.id}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
                  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 2 }}>
                    {m.team1Name} vs {m.team2Name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {m.venue} · {m.format} · {formatDate(m.date)}
                  </div>
                </div>
                <Button onClick={() => router.push(`/scoring/${m.id}`)}>
                  <Activity size={14} /> Open scorer
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
