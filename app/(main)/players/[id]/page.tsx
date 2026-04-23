'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Check, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { playerService } from '@/services/player.service';
import { teamService } from '@/services/team.service';
import type { AddPlayerRequest, PlayerRole, BattingStyle, BowlingStyle } from '@/types/team.types';

const roleOptions: { value: PlayerRole; label: string }[] = [
  { value: 'Batsman', label: 'Batsman' },
  { value: 'Bowler', label: 'Bowler' },
  { value: 'AllRounder', label: 'All-Rounder' },
  { value: 'WicketKeeper', label: 'Wicket-Keeper' },
];

const battingStyleOptions: { value: BattingStyle; label: string }[] = [
  { value: 'RightHanded', label: 'Right Handed' },
  { value: 'LeftHanded', label: 'Left Handed' },
];

const bowlingStyleOptions: { value: BowlingStyle; label: string }[] = [
  { value: 'None', label: 'None / Does not bowl' },
  { value: 'RightArmFast', label: 'Right Arm Fast' },
  { value: 'RightArmMediumFast', label: 'Right Arm Medium Fast' },
  { value: 'RightArmMedium', label: 'Right Arm Medium' },
  { value: 'RightArmOffSpin', label: 'Right Arm Off Spin' },
  { value: 'RightArmLegSpin', label: 'Right Arm Leg Spin' },
  { value: 'LeftArmFast', label: 'Left Arm Fast' },
  { value: 'LeftArmMediumFast', label: 'Left Arm Medium Fast' },
  { value: 'LeftArmMedium', label: 'Left Arm Medium' },
  { value: 'LeftArmOrthodox', label: 'Left Arm Orthodox' },
  { value: 'LeftArmUnorthodox', label: 'Left Arm Unorthodox' },
];

const roleBadge: Record<PlayerRole, 'blue' | 'green' | 'orange' | 'yellow'> = {
  Batsman: 'blue',
  Bowler: 'green',
  AllRounder: 'orange',
  WicketKeeper: 'yellow',
};

function bowlingLabel(style: BowlingStyle): string {
  const map: Record<BowlingStyle, string> = {
    None: 'Does not bowl',
    RightArmFast: 'Right Arm Fast',
    RightArmMediumFast: 'Right Arm Medium Fast',
    RightArmMedium: 'Right Arm Medium',
    RightArmOffSpin: 'Right Arm Off Spin',
    RightArmLegSpin: 'Right Arm Leg Spin',
    LeftArmFast: 'Left Arm Fast',
    LeftArmMediumFast: 'Left Arm Medium Fast',
    LeftArmMedium: 'Left Arm Medium',
    LeftArmOrthodox: 'Left Arm Orthodox',
    LeftArmUnorthodox: 'Left Arm Unorthodox',
  };
  return map[style] ?? style;
}

function roleLabel(role: PlayerRole): string {
  return { Batsman: 'Batsman', Bowler: 'Bowler', AllRounder: 'All-Rounder', WicketKeeper: 'Wicket-Keeper' }[role];
}

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AddPlayerRequest | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => playerService.getPlayer(id),
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams,
  });

  const memberTeams = allTeams.filter((t) =>
    t.players.some((tp) => tp.playerId === id)
  );

  const updateMutation = useMutation({
    mutationFn: (data: Partial<AddPlayerRequest>) => playerService.updatePlayer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['player', id] });
      toast.success('Player updated');
      setEditing(false);
    },
    onError: () => toast.error('Failed to update player'),
  });

  const startEdit = () => {
    if (!player) return;
    setForm({
      name: player.name,
      dateOfBirth: player.dateOfBirth?.split('T')[0] ?? '',
      nationality: player.nationality,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      playerRole: player.playerRole,
      jerseyNumber: player.jerseyNumber,
    });
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm(null);
    setErrors({});
  };

  const validate = () => {
    if (!form) return false;
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    if (!form.nationality.trim()) e.nationality = 'Nationality is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !form) return;
    updateMutation.mutate(form);
  };

  if (isLoading) return <PageSpinner />;
  if (!player) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Player not found.</div>;

  const initials = player.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const dobFormatted = player.dateOfBirth
    ? new Date(player.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <>
      <Topbar
        crumbs={['Players', player.name]}
        right={
          !editing ? (
            <Button onClick={startEdit} size="sm" variant="secondary">
              <Pencil size={13} /> Edit
            </Button>
          ) : null
        }
      />

      <div style={{ padding: '28px 32px 48px', maxWidth: 820 }}>
        <button
          onClick={() => router.push('/players')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-3)', fontSize: 13,
          }}
          className="hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} /> Back to players
        </button>

        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'var(--accent-soft)', border: '2px solid var(--accent)',
            display: 'grid', placeItems: 'center',
            fontSize: 20, fontWeight: 700, color: 'oklch(35% 0.13 150)',
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              {player.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Badge variant={roleBadge[player.playerRole]}>{roleLabel(player.playerRole)}</Badge>
              <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{player.nationality}</span>
              {player.jerseyNumber != null && (
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>· #{player.jerseyNumber}</span>
              )}
            </div>
          </div>
        </div>

        {editing && form ? (
          /* ── Edit form ─────────────────────────────────────────────────── */
          <form onSubmit={handleSave}>
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)', padding: 24,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input
                  label="Full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => f && ({ ...f, name: e.target.value }))}
                  error={errors.name}
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm((f) => f && ({ ...f, dateOfBirth: e.target.value }))}
                  error={errors.dateOfBirth}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Input
                  label="Nationality"
                  value={form.nationality}
                  onChange={(e) => setForm((f) => f && ({ ...f, nationality: e.target.value }))}
                  error={errors.nationality}
                />
                <Input
                  label="Jersey number (optional)"
                  type="number"
                  value={form.jerseyNumber ?? ''}
                  onChange={(e) => setForm((f) => f && ({ ...f, jerseyNumber: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Select
                  label="Player role"
                  options={roleOptions}
                  value={form.playerRole}
                  onChange={(e) => setForm((f) => f && ({ ...f, playerRole: e.target.value as PlayerRole }))}
                />
                <Select
                  label="Batting style"
                  options={battingStyleOptions}
                  value={form.battingStyle}
                  onChange={(e) => setForm((f) => f && ({ ...f, battingStyle: e.target.value as BattingStyle }))}
                />
              </div>
              <Select
                label="Bowling style"
                options={bowlingStyleOptions}
                value={form.bowlingStyle}
                onChange={(e) => setForm((f) => f && ({ ...f, bowlingStyle: e.target.value as BowlingStyle }))}
              />

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  <X size={13} /> Cancel
                </Button>
                <Button type="submit" loading={updateMutation.isPending}>
                  <Check size={13} /> Save changes
                </Button>
              </div>
            </div>
          </form>
        ) : (
          /* ── Detail view ───────────────────────────────────────────────── */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
            }}>
              <SectionTitle>Player details</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                <Field label="Full name" value={player.name} />
                <Field label="Date of birth" value={dobFormatted} />
                <Field label="Nationality" value={player.nationality} />
                <Field label="Jersey number" value={player.jerseyNumber != null ? `#${player.jerseyNumber}` : '—'} />
                <Field label="Player role" value={roleLabel(player.playerRole)} />
                <Field label="Batting style" value={player.battingStyle === 'RightHanded' ? 'Right Handed' : 'Left Handed'} />
                <Field label="Bowling style" value={bowlingLabel(player.bowlingStyle)} last />
              </div>
            </div>

            {/* Teams section */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
            }}>
              <SectionTitle>Teams</SectionTitle>
              {memberTeams.length === 0 ? (
                <div style={{ padding: '24px 20px', color: 'var(--ink-4)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={14} />
                  Not a member of any team yet.
                </div>
              ) : (
                memberTeams.map((team, i) => {
                  const tp = team.players.find((p) => p.playerId === id);
                  return (
                    <div
                      key={team.id}
                      onClick={() => router.push(`/teams/${team.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 20px', cursor: 'pointer',
                        borderBottom: i < memberTeams.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                      className="hover:bg-[var(--bg-hover)]"
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        background: 'var(--accent-soft)', border: '1.5px solid var(--accent)',
                        display: 'grid', placeItems: 'center',
                        fontSize: 11, fontWeight: 700, color: 'oklch(35% 0.13 150)',
                      }}>
                        {(team.shortName ?? team.name ?? '?').slice(0, 3)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{team.name}</div>
                        {tp?.jerseyNumber != null && (
                          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 1 }}>Jersey #{tp.jerseyNumber}</div>
                        )}
                      </div>
                      <ArrowLeft size={14} style={{ color: 'var(--ink-4)', transform: 'rotate(180deg)' }} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '12px 20px', borderBottom: '1px solid var(--border)',
      fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      background: 'var(--bg-sunken)',
      borderRadius: 'var(--radius) var(--radius) 0 0',
    }}>
      {children}
    </div>
  );
}

function Field({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{
      padding: '14px 20px',
      borderBottom: last ? 'none' : '1px solid var(--border)',
      borderRight: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
