'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Activity, Calendar } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { matchService } from '@/services/match.service';
import { formatDate } from '@/utils/format';
import type { Match, MatchStatus } from '@/types/match.types';

const statusBadge: Record<MatchStatus, 'green' | 'red' | 'gray' | 'yellow'> = {
  live: 'red',
  upcoming: 'blue' as 'yellow',
  completed: 'gray',
  abandoned: 'yellow',
};

export default function MatchesPage() {
  const router = useRouter();
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: matchService.getMatches,
    refetchInterval: 15000,
  });

  return (
    <>
      <Topbar
        crumbs={['CrickScore', 'Matches']}
        right={
          <Button onClick={() => router.push('/matches/new')} size="sm">
            <Plus size={14} /> New match
          </Button>
        }
      />

      <div style={{ padding: '28px 32px 48px', maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>Matches</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>All matches — live, upcoming, and completed.</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 80, borderRadius: 'var(--radius)', background: 'var(--bg-sunken)' }} />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No matches yet"
            description="Create your first match to get started with scoring."
            action={{ label: 'New match', onClick: () => router.push('/matches/new') }}
          />
        ) : (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
            {matches.map((match, i) => (
              <MatchRow
                key={match.id}
                match={match}
                last={i === matches.length - 1}
                onScore={() => router.push(`/scoring/${match.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MatchRow({ match, last, onScore }: { match: Match; last: boolean; onScore: () => void }) {
  const batting = match.innings.find((i) => i.inningNumber === match.currentInning);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
        borderBottom: last ? 'none' : '1px solid var(--border)',
        cursor: 'pointer', transition: 'background var(--duration) var(--ease)',
      }}
      className="hover:bg-[var(--bg-hover)]"
      onClick={() => window.location.href = `/matches/${match.id}`}
    >
      {/* Status + format */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', minWidth: 52, flexShrink: 0 }}>
        <Badge variant={statusBadge[match.status]}>{match.status.toUpperCase()}</Badge>
        <span style={{ fontSize: 10.5, color: 'var(--ink-4)', fontWeight: 500 }}>{match.format}</span>
      </div>

      {/* Teams & score */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { name: match.team1Name, short: match.team1ShortName, id: match.team1Id },
            { name: match.team2Name, short: match.team2ShortName, id: match.team2Id },
          ].map((team, j) => {
            const inning = match.innings.find((inn) => inn.teamId === team.id && inn.status !== 'not_started');
            const isBatting = batting?.teamId === team.id;
            return (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: isBatting ? 600 : 400, color: isBatting ? 'var(--ink)' : 'var(--ink-2)', flex: 1 }}>
                  {team.name}
                </span>
                {inning ? (
                  <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {inning.runs}/{inning.wickets}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--ink-3)', fontSize: 12 }}>
                      ({inning.overs}.{inning.balls})
                    </span>
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--ink-4)' }}>—</span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--ink-3)' }}>
          {match.venue} · {formatDate(match.date)}
          {match.result && (
            <span style={{ marginLeft: 8, color: 'var(--accent)', fontWeight: 500 }}>{match.result}</span>
          )}
        </div>
      </div>

      {/* Score action */}
      {match.status === 'live' && (
        <Button
          onClick={(e) => { e.stopPropagation(); onScore(); }}
          size="sm"
          style={{ flexShrink: 0 }}
        >
          <Activity size={13} /> Score
        </Button>
      )}
    </div>
  );
}
