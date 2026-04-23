'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Users, Trophy, Share2, Activity } from 'lucide-react';
import { Topbar } from '@/components/layout/Topbar';
import { matchService } from '@/services/match.service';
import { formatDate } from '@/utils/format';
import type { Match } from '@/types/match.types';

export default function DashboardPage() {
  const router = useRouter();
  const { data: liveMatches = [] } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: matchService.getLiveMatches,
    refetchInterval: 10000,
  });
  const { data: recentMatches = [] } = useQuery({
    queryKey: ['matches', 'recent'],
    queryFn: matchService.getRecentMatches,
  });

  const kpis = [
    { k: 'Live matches', v: String(liveMatches.length || '—'), d: 'Updated live' },
    { k: 'Recent matches', v: String(recentMatches.length || '—'), d: 'Last 7 days' },
    { k: 'Teams registered', v: '—', d: 'Manage teams' },
    { k: 'Tournaments active', v: '—', d: 'Spring window' },
  ];

  return (
    <>
      <Topbar
        crumbs={['CrickScore', 'Dashboard']}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/schedule" style={btnStyle}>
              <Calendar size={14} /> Schedule
            </Link>
            <Link href="/matches/new" style={{ ...btnStyle, background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)' }}>
              <Plus size={14} /> Start match
            </Link>
          </div>
        }
      />

      <div style={{ padding: '28px 32px 48px', maxWidth: 1600 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>
            Live overview across all your matches and tournaments.
          </p>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {kpis.map((k, i) => (
            <div key={i} style={cardStyle}>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500, marginBottom: 4 }}>{k.k}</div>
              <div className="num" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>{k.d}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>
          {/* Live Matches */}
          <div style={cardStyle}>
            <div style={cardHeadStyle}>
              <LiveChip />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Live matches</h3>
              <span style={{ color: 'var(--ink-3)', fontSize: 12, marginLeft: 'auto' }}>Auto-refreshing</span>
            </div>
            {liveMatches.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                No live matches right now.{' '}
                <Link href="/matches/new" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
                  Start one →
                </Link>
              </div>
            ) : (
              liveMatches.map((m) => <LiveMatchCard key={m.id} match={m} onClick={() => router.push(`/scoring/${m.id}`)} />)
            )}
          </div>

          {/* Right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Quick Actions */}
            <div style={cardStyle}>
              <div style={cardHeadStyle}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Quick actions</h3>
              </div>
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { icon: Plus, label: 'New match', sub: 'T20 · ODI · Test · Custom', href: '/matches/new' },
                  { icon: Users, label: 'Create team', sub: 'Roster · jerseys · roles', href: '/teams/new' },
                  { icon: Trophy, label: 'New tournament', sub: 'League · knockout', href: '/tournaments/new' },
                  { icon: Share2, label: 'Share a link', sub: 'Public match page', href: '#' },
                ].map((qa, i) => (
                  <Link
                    key={i}
                    href={qa.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none', color: 'var(--ink)',
                      transition: 'background var(--duration) var(--ease)',
                    }}
                    className="hover:bg-[var(--bg-hover)]"
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: 'var(--bg-sunken)',
                      border: '1px solid var(--border)', display: 'grid', placeItems: 'center', flexShrink: 0,
                    }}>
                      <qa.icon size={15} style={{ color: 'var(--ink-2)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{qa.label}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{qa.sub}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Matches */}
            <div style={cardStyle}>
              <div style={cardHeadStyle}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Recent matches</h3>
                <span style={{ color: 'var(--ink-3)', fontSize: 12, marginLeft: 'auto' }}>Last 5</span>
              </div>
              {recentMatches.length === 0 ? (
                <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--ink-3)' }}>No completed matches yet.</div>
              ) : (
                <div style={{ padding: '8px 0' }}>
                  {recentMatches.map((m) => (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 18px', textDecoration: 'none', color: 'var(--ink)',
                      }}
                      className="hover:bg-[var(--bg-hover)]"
                    >
                      <Activity size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.team1ShortName} vs {m.team2ShortName}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{formatDate(m.date)} · {m.format}</div>
                      </div>
                      {m.result && (
                        <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-3)', flexShrink: 0, maxWidth: 100, textAlign: 'right' }}>
                          {m.result}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function LiveMatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const batting = match.innings.find((i) => i.inningNumber === match.currentInning);
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        cursor: 'pointer', transition: 'background var(--duration) var(--ease)',
      }}
      className="hover:bg-[var(--bg-hover)]"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          {[
            { name: match.team1Name, short: match.team1ShortName, isBatting: batting?.teamId === match.team1Id },
            { name: match.team2Name, short: match.team2ShortName, isBatting: batting?.teamId === match.team2Id },
          ].map((team, i) => {
            const inning = match.innings.find((inn) =>
              (i === 0 ? inn.teamId === match.team1Id : inn.teamId === match.team2Id) && inn.status !== 'not_started'
            );
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TeamFlag short={team.short} batting={team.isBatting} />
                <span style={{
                  fontSize: 14, fontWeight: team.isBatting ? 600 : 400,
                  color: team.isBatting ? 'var(--ink)' : 'var(--ink-2)', flex: 1,
                }}>
                  {team.name}
                </span>
                {inning ? (
                  <span className="num" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                    {inning.runs}<span style={{ color: 'var(--ink-3)', fontWeight: 400 }}>/{inning.wickets}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 4 }}>
                      ({inning.overs}.{inning.balls})
                    </span>
                  </span>
                ) : (
                  <span style={{ fontSize: 14, color: 'var(--ink-4)' }}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{match.venue} · {match.format}</span>
      </div>
    </div>
  );
}

function TeamFlag({ short, batting }: { short: string; batting: boolean }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6,
      background: batting ? 'var(--accent-soft)' : 'var(--bg-sunken)',
      border: `1.5px solid ${batting ? 'var(--accent)' : 'var(--border)'}`,
      display: 'grid', placeItems: 'center',
      fontSize: 10, fontWeight: 700,
      color: batting ? 'oklch(35% 0.13 150)' : 'var(--ink-3)',
      flexShrink: 0,
    }}>
      {short.slice(0, 3)}
    </div>
  );
}

function LiveChip() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 500,
      background: 'var(--danger)', color: 'white',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse 1.4s ease-in-out infinite' }} />
      LIVE
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-sm)',
};

const cardHeadStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '14px 18px', borderBottom: '1px solid var(--border)',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '7px 14px', borderRadius: 'var(--radius-sm)',
  fontSize: 13, fontWeight: 500,
  border: '1px solid var(--border-strong)',
  background: 'var(--bg-elevated)', color: 'var(--ink)',
  textDecoration: 'none', whiteSpace: 'nowrap',
};
