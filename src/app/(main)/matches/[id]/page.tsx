'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageSpinner } from '@/components/ui/Spinner';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import { formatDate } from '@/utils/format';
import type { MatchStatus, TossDecision } from '@/types/match.types';

const statusBadge: Record<MatchStatus, 'green' | 'red' | 'gray' | 'yellow'> = {
  live: 'red',
  upcoming: 'yellow',
  completed: 'gray',
  abandoned: 'yellow',
};

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [showToss, setShowToss] = useState(false);
  const [tossWinner, setTossWinner] = useState('');
  const [tossDecision, setTossDecision] = useState<TossDecision>('Bat');

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatch(id),
    refetchInterval: (query) => query.state.data?.status === 'live' ? 10000 : false,
  });

  const { data: team1 } = useQuery({
    queryKey: ['team', match?.team1Id],
    queryFn: () => teamService.getTeam(match!.team1Id),
    enabled: !!match?.team1Id,
  });

  const { data: team2 } = useQuery({
    queryKey: ['team', match?.team2Id],
    queryFn: () => teamService.getTeam(match!.team2Id),
    enabled: !!match?.team2Id,
  });

  const startMutation = useMutation({
    mutationFn: () => matchService.startMatch(id, { tossWinnerTeamId: tossWinner, tossDecision }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match', id] });
      toast.success('Match started!');
      setShowToss(false);
      router.push(`/scoring/${id}`);
    },
    onError: () => toast.error('Failed to start match'),
  });

  if (isLoading) return <PageSpinner />;
  if (!match) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Match not found.</div>;

  const tossOptions = [
    { value: match.team1Id, label: match.team1Name },
    { value: match.team2Id, label: match.team2Name },
  ];

  return (
    <>
      <Topbar
        crumbs={['Matches', `${match.team1ShortName} vs ${match.team2ShortName}`]}
        right={
          match.status === 'live' ? (
            <Button onClick={() => router.push(`/scoring/${id}`)}>
              <Activity size={14} /> Open scorer
            </Button>
          ) : match.status === 'upcoming' ? (
            <Button onClick={() => setShowToss(true)}>
              <Activity size={14} /> Start match
            </Button>
          ) : null
        }
      />

      <div style={{ padding: '28px 32px 48px', maxWidth: 900 }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 13 }}
          className="hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} /> Back to matches
        </button>

        {/* Match header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Badge variant={statusBadge[match.status]}>{match.status.toUpperCase()}</Badge>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{match.format} · {match.venue} · {formatDate(match.date)}</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            {match.team1Name} <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>vs</span> {match.team2Name}
          </h1>
          {match.tossWinnerId && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
              {match.tossWinnerId === match.team1Id ? match.team1Name : match.team2Name} won the toss and chose to{' '}
              <strong>{match.tossDecision}</strong> first.
            </p>
          )}
          {match.result && (
            <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>{match.result}</p>
          )}
        </div>

        {/* Innings Scorecards */}
        {match.innings.map((inning) => (
          <div key={inning.id} style={{ marginBottom: 20 }}>
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                  {inning.teamName} — Innings {inning.inningNumber}
                </h3>
                <span className="num" style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                  {inning.runs}/{inning.wickets}
                  <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 400, marginLeft: 6 }}>
                    ({inning.overs}.{inning.balls} ov)
                  </span>
                </span>
              </div>

              {/* Batting */}
              {inning.battingScores.length > 0 && (
                <div>
                  <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', display: 'grid', gridTemplateColumns: '1fr 48px 56px 40px 40px 60px', gap: 8, fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>
                    <span>BATTER</span><span style={{ textAlign: 'right' }}>R</span><span style={{ textAlign: 'right' }}>B</span>
                    <span style={{ textAlign: 'right' }}>4s</span><span style={{ textAlign: 'right' }}>6s</span><span style={{ textAlign: 'right' }}>SR</span>
                  </div>
                  {inning.battingScores.map((bs, i) => (
                    <div key={i} style={{
                      padding: '10px 18px', display: 'grid', gridTemplateColumns: '1fr 48px 56px 40px 40px 60px', gap: 8,
                      borderTop: '1px solid var(--border)', fontSize: 13, alignItems: 'center',
                      background: bs.isOnStrike ? 'var(--accent-soft)' : 'transparent',
                    }}>
                      <div>
                        <span style={{ fontWeight: bs.isOnStrike ? 700 : 500, color: 'var(--ink)' }}>{bs.playerName}</span>
                        {bs.isOnStrike && <span style={{ marginLeft: 6, fontSize: 10, color: 'oklch(35% 0.13 150)', background: 'var(--accent-soft)', padding: '1px 5px', borderRadius: 4, fontWeight: 600 }}>*</span>}
                        {bs.isOut && bs.dismissalType && (
                          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 1 }}>
                            {bs.dismissalType} {bs.bowlerName ? `b. ${bs.bowlerName}` : ''}
                          </div>
                        )}
                      </div>
                      <span className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{bs.runs}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bs.balls}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bs.fours}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bs.sixes}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bs.strikeRate.toFixed(1)}</span>
                    </div>
                  ))}
                  <div style={{ padding: '8px 18px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)' }}>
                    Extras: {inning.extras.total} (wd {inning.extras.wides}, nb {inning.extras.noBalls}, b {inning.extras.byes}, lb {inning.extras.legByes})
                  </div>
                </div>
              )}

              {/* Bowling */}
              {inning.bowlingFigures.length > 0 && (
                <div style={{ borderTop: '2px solid var(--border)' }}>
                  <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', display: 'grid', gridTemplateColumns: '1fr 48px 56px 48px 56px 64px', gap: 8, fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>
                    <span>BOWLER</span><span style={{ textAlign: 'right' }}>O</span><span style={{ textAlign: 'right' }}>M</span>
                    <span style={{ textAlign: 'right' }}>R</span><span style={{ textAlign: 'right' }}>W</span><span style={{ textAlign: 'right' }}>ECON</span>
                  </div>
                  {inning.bowlingFigures.map((bf, i) => (
                    <div key={i} style={{
                      padding: '10px 18px', display: 'grid', gridTemplateColumns: '1fr 48px 56px 48px 56px 64px', gap: 8,
                      borderTop: '1px solid var(--border)', fontSize: 13, alignItems: 'center',
                      background: bf.isCurrentBowler ? 'var(--accent-soft)' : 'transparent',
                    }}>
                      <span style={{ fontWeight: bf.isCurrentBowler ? 700 : 500, color: 'var(--ink)' }}>{bf.playerName}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bf.overs}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bf.maidens}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bf.runs}</span>
                      <span className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{bf.wickets}</span>
                      <span className="num" style={{ textAlign: 'right', color: 'var(--ink-3)' }}>{bf.economy.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Toss Modal */}
      <Modal open={showToss} onClose={() => setShowToss(false)} title="Start match — toss">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Select
            label="Toss winner"
            options={tossOptions}
            placeholder="Select winner"
            value={tossWinner}
            onChange={(e) => setTossWinner(e.target.value)}
          />
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
              Elected to
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['Bat', 'Bowl'] as TossDecision[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTossDecision(d)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    border: '1.5px solid',
                    borderColor: tossDecision === d ? 'var(--accent)' : 'var(--border)',
                    background: tossDecision === d ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                    color: tossDecision === d ? 'oklch(35% 0.13 150)' : 'var(--ink-2)',
                  }}
                >
                  {d} first
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowToss(false)}>Cancel</Button>
            <Button onClick={() => startMutation.mutate()} loading={startMutation.isPending} disabled={!tossWinner}>
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
