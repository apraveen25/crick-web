'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Share2, Keyboard, Undo2, X, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { PageSpinner } from '@/components/ui/Spinner';
import { scoringService } from '@/services/scoring.service';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import { formatOvers, getBallDisplay, getBallColor } from '@/utils/format';
import type { BallType, WicketType, DeliverBallRequest } from '@/types/scoring.types';

type BallEvent =
  | { type: 'run'; runs: number }
  | { type: 'extra'; kind: BallType; runs: number }
  | { type: 'wicket'; how: string; runs?: number };

export default function ScoringPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [modal, setModal] = useState<'wicket' | 'extras' | 'bowler' | 'batsman' | null>(null);
  const [extraKind, setExtraKind] = useState<BallType | null>(null);
  const [history, setHistory] = useState<unknown[]>([]);
  const [freeHit, setFreeHit] = useState(false);

  const { data: liveScore, isLoading } = useQuery({
    queryKey: ['live', id],
    queryFn: () => scoringService.getLiveScore(id),
    refetchInterval: 5000,
  });

  const { data: match } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchService.getMatch(id),
  });

  const { data: bowlingTeam } = useQuery({
    queryKey: ['team', liveScore?.bowlingTeamId],
    queryFn: () => teamService.getTeam(liveScore!.bowlingTeamId),
    enabled: !!liveScore?.bowlingTeamId,
  });

  const { data: battingTeam } = useQuery({
    queryKey: ['team', liveScore?.battingTeamId],
    queryFn: () => teamService.getTeam(liveScore!.battingTeamId),
    enabled: !!liveScore?.battingTeamId,
  });

  const ballMutation = useMutation({
    mutationFn: scoringService.deliverBall,
    onSuccess: (ball) => {
      setHistory((h) => [...h, ball]);
      qc.invalidateQueries({ queryKey: ['live', id] });
      const isNoBall = ball.ballType === 'no_ball';
      setFreeHit(isNoBall);
      if (ball.isWicket) toast.error('WICKET!', { duration: 3000, icon: '🏏' });
      else if (ball.runs === 6) toast.success('SIX!', { icon: '💥' });
      else if (ball.runs === 4) toast.success('FOUR!', { icon: '🏃' });
    },
    onError: () => toast.error('Failed to record ball'),
  });

  const undoMutation = useMutation({
    mutationFn: () => scoringService.undoLastBall(liveScore!.striker.playerId),
    onSuccess: () => {
      setHistory((h) => h.slice(0, -1));
      qc.invalidateQueries({ queryKey: ['live', id] });
      setFreeHit(false);
      toast.success('Ball undone');
    },
    onError: () => toast.error('Undo failed'),
  });

  const deliverBall = useCallback(
    (runs: number, ballType: BallType = 'normal', isWicket = false, wicketType?: WicketType) => {
      if (!liveScore) return;
      const req: DeliverBallRequest = {
        inningId: match?.innings.find((i) => i.inningNumber === liveScore.currentInning)?.id ?? '',
        batsmanId: liveScore.striker.playerId,
        bowlerId: liveScore.currentBowler.playerId,
        runs,
        ballType,
        isWicket,
        wicketType,
      };
      ballMutation.mutate(req);
    },
    [liveScore, match, ballMutation]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modal || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const k = e.key;
      if (k >= '0' && k <= '6') { deliverBall(Number(k)); e.preventDefault(); }
      else if (k === 'w' || k === 'W') { e.preventDefault(); setExtraKind('wide'); setModal('extras'); }
      else if (k === 'n' || k === 'N') { e.preventDefault(); setExtraKind('no_ball'); setModal('extras'); }
      else if (k === 'b' || k === 'B') { e.preventDefault(); deliverBall(1, 'bye'); }
      else if (k === 'l' || k === 'L') { e.preventDefault(); deliverBall(1, 'leg_bye'); }
      else if (k === 'x' || k === 'X') { e.preventDefault(); setModal('wicket'); }
      else if (k === 'u' || k === 'U' || (k === 'z' && (e.metaKey || e.ctrlKey))) { e.preventDefault(); undoMutation.mutate(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, deliverBall, undoMutation]);

  const lastBall = liveScore?.lastSixBalls[0];
  const lastBallLabel = useMemo(() => {
    if (!lastBall) return '—';
    if (lastBall.isWicket) return 'WICKET';
    if (lastBall.ballType !== 'normal') return `${lastBall.ballType.toUpperCase()} +${lastBall.runs}`;
    return `${lastBall.runs} run${lastBall.runs === 1 ? '' : 's'}`;
  }, [lastBall]);

  const availableBowlers = bowlingTeam?.players.filter((p) =>
    p.playerId !== liveScore?.currentBowler.playerId
  ) ?? [];

  const availableBatsmen = battingTeam?.players.filter((p) =>
    p.playerId !== liveScore?.striker.playerId && p.playerId !== liveScore?.nonStriker.playerId
  ) ?? [];

  if (isLoading) return <PageSpinner />;
  if (!liveScore) return (
    <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)' }}>
      <p>No live data. Make sure the match has started and innings are set up.</p>
      <Button onClick={() => router.push(`/matches/${id}`)} variant="secondary" style={{ marginTop: 12 }}>
        Back to match
      </Button>
    </div>
  );

  const { striker, nonStriker, currentBowler, runs, wickets, overs, balls, runRate, requiredRunRate, target, lastSixBalls } = liveScore;

  return (
    <>
      <Topbar
        crumbs={['Matches', `${liveScore.battingTeamName} vs ${liveScore.bowlingTeamName}`, 'Scoring']}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiveChip />
            {freeHit && <FreeHitChip />}
            <Button variant="outline" size="sm" onClick={() => {}}>
              <Share2 size={13} /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setModal('wicket')}>
              <Keyboard size={13} /> Shortcuts
            </Button>
          </div>
        }
      />

      <div style={{ padding: '20px 28px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            Scoring console
          </h1>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            {liveScore.battingTeamName} vs {liveScore.bowlingTeamName} · {match?.format} · Innings {liveScore.currentInning}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Score strip */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
              padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)', marginBottom: 4 }}>
                  {liveScore.battingTeamName} · Batting
                </div>
                <div className="num" style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: 'var(--ink)' }}>
                  {runs}<span style={{ fontSize: 28, color: 'var(--ink-3)', fontWeight: 400 }}>/{wickets}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                  {formatOvers(overs, balls)} / {match?.totalOvers ?? '—'}.0 overs
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>INN {liveScore.currentInning}</span>
                <span style={{
                  display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
                  fontSize: 11.5, fontWeight: 600,
                  background: 'var(--accent-soft)', color: 'oklch(35% 0.13 150)',
                }}>
                  CRR {runRate.toFixed(2)}
                </span>
                {requiredRunRate && (
                  <span style={{
                    display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
                    fontSize: 11, fontWeight: 500,
                    background: 'var(--warn-soft)', color: 'oklch(38% 0.14 75)',
                  }}>
                    RRR {requiredRunRate.toFixed(2)}
                  </span>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)', marginBottom: 4 }}>
                  {liveScore.bowlingTeamName} · Bowling
                </div>
                <div className="num" style={{ fontSize: 32, fontWeight: 600, color: 'var(--ink-3)' }}>
                  {target ? target - 1 : '—'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                  {target ? `target ${target}` : 'first innings'}
                </div>
              </div>
            </div>

            {/* Free Hit banner */}
            {freeHit && (
              <div className="freehit-banner">FREE HIT active — only run-out counts as a wicket</div>
            )}

            {/* Batters */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              {[
                { player: striker, isStrike: true },
                { player: nonStriker, isStrike: false },
              ].map(({ player, isStrike }) => (
                <div
                  key={player.playerId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px',
                    borderBottom: isStrike ? '1px solid var(--border)' : 'none',
                    background: isStrike ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{player.playerName}</span>
                      {isStrike && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent)', color: 'white', padding: '1px 5px', borderRadius: 4 }}>
                          on strike
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 13 }}>
                    <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{player.runs}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, color: 'var(--ink-3)', fontSize: 12 }}>
                      <strong style={{ color: 'var(--ink-2)' }}>{player.balls}b</strong>
                      <span>{player.fours}×4 · {player.sixes}×6</span>
                      <span>SR {player.strikeRate.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Current bowler */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                borderTop: '2px solid var(--border)', background: 'var(--bg-sunken)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)' }}>{currentBowler.playerName}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Current bowler</div>
                </div>
                <div className="mono num" style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--ink-2)' }}>
                  <span><strong>{currentBowler.overs}</strong> <span style={{ color: 'var(--ink-4)' }}>ov</span></span>
                  <span><strong>{currentBowler.runs}</strong> <span style={{ color: 'var(--ink-4)' }}>r</span></span>
                  <span><strong>{currentBowler.wickets}</strong> <span style={{ color: 'var(--ink-4)' }}>w</span></span>
                  <span><strong>{currentBowler.economy.toFixed(2)}</strong> <span style={{ color: 'var(--ink-4)' }}>econ</span></span>
                </div>
                <button
                  onClick={() => setModal('bowler')}
                  style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  Change
                </button>
              </div>
            </div>

            {/* This over */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', marginRight: 4 }}>This over</span>
                {lastSixBalls.length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>New over — bowler ready</span>
                ) : (
                  [...lastSixBalls].reverse().map((ball, i) => (
                    <div
                      key={i}
                      className={`ball-chip ${getBallColorClass(ball.runs, ball.ballType, ball.isWicket)}`}
                    >
                      {getBallDisplay(ball.runs, ball.ballType, ball.isWicket)}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Numpad */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Ball input</h3>
                <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>0–6 · W wide · N no-ball · B bye · L leg-bye · X wicket · U undo</span>
              </div>

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Run buttons grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {([0, 1, 2, 3, 4, 5, 6] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => deliverBall(r)}
                      disabled={ballMutation.isPending}
                      style={{
                        height: 64, borderRadius: 'var(--radius)', fontSize: 22, fontWeight: 700,
                        cursor: 'pointer', border: '1.5px solid',
                        borderColor: r === 4 ? 'oklch(75% 0.09 250)' : r === 6 ? 'var(--accent)' : 'var(--border)',
                        background: r === 4 ? 'oklch(92% 0.06 250)' : r === 6 ? 'var(--accent-soft)' : 'var(--bg-sunken)',
                        color: r === 4 ? 'oklch(35% 0.12 250)' : r === 6 ? 'oklch(35% 0.13 150)' : r === 0 ? 'var(--ink-4)' : 'var(--ink)',
                        transition: 'all var(--duration) var(--ease)',
                        fontVariantNumeric: 'tabular-nums',
                        position: 'relative',
                      }}
                      className="hover:brightness-95 active:scale-95"
                    >
                      {r === 0 ? '·' : r}
                      <span style={{
                        position: 'absolute', bottom: 4, right: 6, fontSize: 9,
                        color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', fontWeight: 400,
                      }}>
                        {r}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => deliverBall(7)}
                    disabled={ballMutation.isPending}
                    style={{
                      height: 64, borderRadius: 'var(--radius)', fontSize: 16, fontWeight: 600,
                      cursor: 'pointer', border: '1.5px solid var(--border)',
                      background: 'var(--bg-sunken)', color: 'var(--ink-3)',
                      transition: 'all var(--duration) var(--ease)',
                    }}
                  >
                    7+
                  </button>
                </div>

                {/* Extras row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'Wide', kbd: 'W', onClick: () => { setExtraKind('wide'); setModal('extras'); } },
                    { label: 'No ball', kbd: 'N', onClick: () => { setExtraKind('no_ball'); setModal('extras'); } },
                    { label: 'Bye', kbd: 'B', onClick: () => deliverBall(1, 'bye') },
                    { label: 'Leg bye', kbd: 'L', onClick: () => deliverBall(1, 'leg_bye') },
                  ].map((btn) => (
                    <ActionBtn key={btn.label} label={btn.label} kbd={btn.kbd} onClick={btn.onClick} />
                  ))}
                </div>

                {/* Action row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  <ActionBtn
                    label="Wicket"
                    kbd="X"
                    onClick={() => setModal('wicket')}
                    danger
                    icon={<X size={13} />}
                  />
                  <ActionBtn
                    label="Swap strike"
                    kbd="S"
                    onClick={() => {
                      toast.success('Strike swapped');
                    }}
                    icon={<RotateCcw size={12} />}
                  />
                  <ActionBtn label="Retire" kbd="R" onClick={() => {}} />
                  <ActionBtn label="New bowler" kbd="⇧B" onClick={() => setModal('bowler')} />
                </div>

                {/* Undo bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  paddingTop: 10, borderTop: '1px solid var(--border)',
                }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => undoMutation.mutate()}
                    disabled={history.length === 0 || undoMutation.isPending}
                    loading={undoMutation.isPending}
                  >
                    <Undo2 size={13} /> Undo last ball
                  </Button>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                    · {history.length} ball{history.length === 1 ? '' : 's'} undoable
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 12, fontWeight: 500,
                    padding: '2px 10px', borderRadius: 999,
                    background: 'var(--bg-sunken)', border: '1px solid var(--border)',
                    color: 'var(--ink-2)',
                  }}>
                    Last: {lastBallLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT RAIL ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Match stats */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Match stats</h3>
              </div>
              <div style={{ padding: '12px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <StatItem label="Run rate" value={runRate.toFixed(2)} sub="current" />
                <StatItem label="Required RR" value={requiredRunRate?.toFixed(2) ?? '—'} sub={target ? `target ${target}` : 'first innings'} />
                <StatItem label="Overs" value={formatOvers(overs, balls)} sub={`${(match?.totalOvers ?? 0) - overs} ov left`} />
                <StatItem label="Partnership" value="—" sub="runs (balls)" />
              </div>
            </div>

            {/* Commentary / ball log */}
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Commentary</h3>
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Ball-by-ball</span>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {lastSixBalls.length === 0 ? (
                  <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--ink-3)' }}>
                    No balls scored yet — try pressing 4, 6, or W.
                  </div>
                ) : (
                  lastSixBalls.map((ball, i) => {
                    const isWkt = ball.isWicket;
                    const isFour = ball.runs === 4 && !isWkt;
                    const isSix = ball.runs === 6 && !isWkt;
                    const pill = isWkt ? 'W' : ball.ballType !== 'normal' ? ball.ballType.slice(0, 2).toUpperCase() : ball.runs === 0 ? '·' : String(ball.runs);
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 18px',
                          borderBottom: i < lastSixBalls.length - 1 ? '1px solid var(--border)' : 'none',
                          background: isWkt ? 'var(--danger-soft)' : 'transparent',
                        }}
                      >
                        <span style={{ fontSize: 11, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginTop: 1 }}>
                          {ball.overNumber}.{ball.ballNumber}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700, flexShrink: 0,
                          background: isWkt ? 'var(--danger)' : isSix ? 'var(--accent-soft)' : isFour ? 'oklch(92% 0.06 250)' : 'var(--bg-sunken)',
                          color: isWkt ? 'white' : isSix ? 'oklch(35% 0.13 150)' : isFour ? 'oklch(35% 0.12 250)' : 'var(--ink-3)',
                          border: '1px solid',
                          borderColor: isWkt ? 'var(--danger)' : isSix ? 'var(--accent)' : isFour ? 'oklch(75% 0.09 250)' : 'var(--border)',
                        }}>
                          {pill}
                        </span>
                        <span style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.4 }}>
                          {ball.commentary || defaultCommentary(ball)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Extras modal */}
      <Modal open={modal === 'extras'} onClose={() => { setModal(null); setExtraKind(null); }} title={extraKind === 'wide' ? 'Wide' : 'No ball'} size="sm">
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)' }}>
          How many total runs off the ball?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {getExtraOptions(extraKind ?? 'wide').map((opt, i) => (
            <button
              key={i}
              onClick={() => { deliverBall(opt.r, extraKind ?? 'wide'); setModal(null); setExtraKind(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--ink)', cursor: 'pointer', fontSize: 13,
                transition: 'background var(--duration) var(--ease)', textAlign: 'left',
              }}
              className="hover:bg-[var(--bg-hover)]"
            >
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--warn-soft)', border: '1px solid var(--warn)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: 'oklch(38% 0.14 75)', flexShrink: 0 }}>{opt.r}</span>
              {opt.l}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => { setModal(null); setExtraKind(null); }}>Cancel · Esc</Button>
        </div>
      </Modal>

      {/* Wicket modal */}
      <Modal open={modal === 'wicket'} onClose={() => setModal(null)} title="Wicket — how?" size="sm">
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)' }}>
          Select the mode of dismissal.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {wicketTypes.map((kind, i) => (
            <button
              key={i}
              onClick={() => { deliverBall(0, 'normal', true, kind.value); setModal(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                background: 'var(--bg-elevated)', color: 'var(--ink)', cursor: 'pointer', fontSize: 13,
                transition: 'background var(--duration) var(--ease)', textAlign: 'left',
              }}
              className="hover:bg-[var(--danger-soft)]"
            >
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--danger-soft)', border: '1px solid var(--danger)', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, color: 'var(--danger)', flexShrink: 0 }}>W</span>
              {kind.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel · Esc</Button>
        </div>
      </Modal>

      {/* Change bowler modal */}
      <Modal open={modal === 'bowler'} onClose={() => setModal(null)} title="Select new bowler" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {availableBowlers.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>No available bowlers.</p>
          ) : (
            availableBowlers.map((tp) => (
              <button
                key={tp.playerId}
                onClick={async () => {
                  await scoringService.changeBowler(match?.innings[0]?.id ?? '', { bowlerId: tp.playerId });
                  qc.invalidateQueries({ queryKey: ['live', id] });
                  setModal(null);
                  toast.success(`${tp.player.name} is now bowling`);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  background: 'var(--bg-elevated)', color: 'var(--ink)', cursor: 'pointer', fontSize: 13,
                  textAlign: 'left',
                }}
                className="hover:bg-[var(--bg-hover)]"
              >
                {tp.player.name}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-3)', textTransform: 'capitalize' }}>{tp.player.playerRole}</span>
              </button>
            ))
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}

function ActionBtn({ label, kbd, onClick, danger, icon }: { label: string; kbd: string; onClick: () => void; danger?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 8px', borderRadius: 'var(--radius-sm)', fontSize: 12.5, fontWeight: 500,
        cursor: 'pointer', border: '1.5px solid',
        borderColor: danger ? 'var(--danger)' : 'var(--border)',
        background: danger ? 'var(--danger-soft)' : 'var(--bg-sunken)',
        color: danger ? 'var(--danger)' : 'var(--ink-2)',
        transition: 'all var(--duration) var(--ease)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        position: 'relative',
      }}
      className="hover:brightness-95 active:scale-95"
    >
      {icon}
      {label}
      <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 8.5, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>
        {kbd}
      </span>
    </button>
  );
}

function StatItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500 }}>{label}</div>
      <div className="num" style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.1, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function LiveChip() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'var(--danger)', color: 'white' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white', animation: 'pulse 1.4s ease-in-out infinite' }} />
      LIVE
    </span>
  );
}

function FreeHitChip() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: 'var(--warn-soft)', color: 'oklch(38% 0.14 75)', border: '1px solid var(--warn)' }}>
      Free Hit
    </span>
  );
}

function getBallColorClass(runs: number, ballType: string, isWicket: boolean): string {
  if (isWicket) return 'wkt';
  if (ballType === 'wide' || ballType === 'no_ball') return 'extra';
  if (runs === 4) return 'run4';
  if (runs === 6) return 'run6';
  if (runs === 0) return 'run0';
  return '';
}

function getExtraOptions(kind: BallType) {
  if (kind === 'wide') {
    return [
      { r: 1, l: 'Wide only' }, { r: 2, l: 'Wide + 1' }, { r: 3, l: 'Wide + 2' },
      { r: 5, l: 'Wide + 4 (boundary)' }, { r: 7, l: 'Wide + 6' },
    ];
  }
  return [
    { r: 1, l: 'No ball only' }, { r: 2, l: 'NB + 1 off bat' }, { r: 3, l: 'NB + 2' },
    { r: 4, l: 'NB + 3' }, { r: 5, l: 'NB + 4 (boundary)' }, { r: 7, l: 'NB + 6' },
  ];
}

const wicketTypes: { value: WicketType; label: string }[] = [
  { value: 'bowled', label: 'Bowled' },
  { value: 'caught', label: 'Caught' },
  { value: 'lbw', label: 'LBW' },
  { value: 'run_out', label: 'Run Out (striker)' },
  { value: 'run_out', label: 'Run Out (non-striker)' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'hit_wicket', label: 'Hit wicket' },
  { value: 'obstructing_field', label: 'Obstructing the field' },
];

function defaultCommentary(ball: { runs: number; isWicket: boolean; ballType: string; batsmanName: string; bowlerName: string }): string {
  if (ball.isWicket) return `WICKET — ${ball.batsmanName}`;
  if (ball.ballType === 'wide') return `Wide ${ball.runs > 1 ? `+${ball.runs - 1}` : ''}`;
  if (ball.ballType === 'no_ball') return `No ball${ball.runs > 1 ? ` +${ball.runs - 1} off bat` : ''}`;
  if (ball.runs === 6) return `SIX! ${ball.batsmanName} sends it over the rope`;
  if (ball.runs === 4) return `FOUR! ${ball.batsmanName} plays a fine shot`;
  if (ball.runs === 0) return `Dot ball — ${ball.bowlerName} beats the bat`;
  return `${ball.runs} run${ball.runs !== 1 ? 's' : ''} — ${ball.batsmanName}`;
}
