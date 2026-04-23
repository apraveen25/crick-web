'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
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

const roleBadgeVariant: Record<PlayerRole, 'blue' | 'green' | 'orange' | 'yellow'> = {
  Batsman: 'blue',
  Bowler: 'green',
  AllRounder: 'orange',
  WicketKeeper: 'yellow',
};

const roleLabel: Record<PlayerRole, string> = {
  Batsman: 'Batsman',
  Bowler: 'Bowler',
  AllRounder: 'All-Rounder',
  WicketKeeper: 'Keeper',
};

const emptyForm: AddPlayerRequest = {
  name: '',
  dateOfBirth: '',
  nationality: '',
  battingStyle: 'RightHanded',
  bowlingStyle: 'None',
  playerRole: 'Batsman',
  jerseyNumber: undefined,
};

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<AddPlayerRequest>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getTeam(id),
  });

  const addMutation = useMutation({
    mutationFn: (data: AddPlayerRequest) => teamService.addPlayer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Player added');
      setShowAdd(false);
      setForm(emptyForm);
    },
    onError: () => toast.error('Failed to add player'),
  });

  const removeMutation = useMutation({
    mutationFn: (playerId: string) => teamService.removePlayer(id, playerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Player removed');
    },
    onError: () => toast.error('Failed to remove player'),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Player name is required';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    if (!form.nationality.trim()) e.nationality = 'Nationality is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    addMutation.mutate(form);
  };

  if (isLoading) return <PageSpinner />;
  if (!team) return <div style={{ padding: 32, color: 'var(--ink-3)' }}>Team not found.</div>;

  return (
    <>
      <Topbar
        crumbs={['Teams', team.name]}
        right={
          <Button onClick={() => setShowAdd(true)} size="sm">
            <Plus size={14} /> Add player
          </Button>
        }
      />

      <div style={{ padding: '28px 32px 48px', maxWidth: 900 }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--ink-3)', fontSize: 13,
          }}
          className="hover:text-[var(--ink)]"
        >
          <ArrowLeft size={14} /> Back to teams
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: 'var(--accent-soft)', border: '2px solid var(--accent)',
            display: 'grid', placeItems: 'center',
            fontSize: 16, fontWeight: 700, color: 'oklch(35% 0.13 150)',
          }}>
            {(team.shortName ?? team.name ?? '?').slice(0, 3)}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              {team.name}
            </h1>
            <p style={{ margin: '2px 0 0', color: 'var(--ink-3)', fontSize: 13 }}>
              {team.players.length} player{team.players.length !== 1 ? 's' : ''} · {team.shortName}
            </p>
          </div>
        </div>

        {/* Player List */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Header row */}
          <div style={{
            padding: '10px 18px', borderBottom: '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: '36px 1fr 90px 90px 120px 120px 60px',
            gap: 12, fontSize: 11, color: 'var(--ink-3)', fontWeight: 600,
            background: 'var(--bg-sunken)', borderRadius: 'var(--radius) var(--radius) 0 0',
          }}>
            <span>#</span>
            <span>PLAYER</span>
            <span>ROLE</span>
            <span>BATTING</span>
            <span>BOWLING</span>
            <span>NATIONALITY</span>
            <span />
          </div>

          {team.players.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No players yet. Add your first player.
            </div>
          ) : (
            team.players.map((tp, i) => {
              const p = tp.player;
              const jerseyNo = tp.jerseyNumber ?? p.jerseyNumber;
              return (
                <div
                  key={tp.playerId}
                  style={{
                    display: 'grid', gridTemplateColumns: '36px 1fr 90px 90px 120px 120px 60px',
                    gap: 12, alignItems: 'center', padding: '12px 18px',
                    borderBottom: i < team.players.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--bg-sunken)', border: '1px solid var(--border)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 11, fontWeight: 600, color: 'var(--ink-2)',
                  }}>
                    {jerseyNo ?? i + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{p.name}</div>
                    {p.dateOfBirth && (
                      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 1 }}>
                        {new Date(p.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <Badge variant={roleBadgeVariant[p.playerRole]}>
                    {roleLabel[p.playerRole]}
                  </Badge>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    {p.battingStyle === 'RightHanded' ? 'Right' : 'Left'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {formatBowlingStyle(p.bowlingStyle)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {p.nationality}
                  </span>
                  <button
                    onClick={() => { if (confirm(`Remove ${p.name}?`)) removeMutation.mutate(tp.playerId); }}
                    style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-4)', justifySelf: 'end' }}
                    className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                  >
                    <UserX size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setForm(emptyForm); }} title="Add player" size="lg">
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Row 1: Name + DOB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Full name"
              placeholder="Sachin Tendulkar"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              error={errors.dateOfBirth}
            />
          </div>

          {/* Row 2: Nationality + Jersey */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Nationality"
              placeholder="Indian"
              value={form.nationality}
              onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
              error={errors.nationality}
            />
            <Input
              label="Jersey number (optional)"
              type="number"
              placeholder="10"
              value={form.jerseyNumber ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, jerseyNumber: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>

          {/* Row 3: Role + Batting style */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Select
              label="Player role"
              options={roleOptions}
              value={form.playerRole}
              onChange={(e) => setForm((f) => ({ ...f, playerRole: e.target.value as PlayerRole }))}
            />
            <Select
              label="Batting style"
              options={battingStyleOptions}
              value={form.battingStyle}
              onChange={(e) => setForm((f) => ({ ...f, battingStyle: e.target.value as BattingStyle }))}
            />
          </div>

          {/* Row 4: Bowling style (full width) */}
          <Select
            label="Bowling style"
            options={bowlingStyleOptions}
            value={form.bowlingStyle}
            onChange={(e) => setForm((f) => ({ ...f, bowlingStyle: e.target.value as BowlingStyle }))}
          />

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => { setShowAdd(false); setForm(emptyForm); }}>
              Cancel
            </Button>
            <Button type="submit" loading={addMutation.isPending}>Add player</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function formatBowlingStyle(style: BowlingStyle): string {
  const map: Record<BowlingStyle, string> = {
    None: '—',
    RightArmFast: 'RAF',
    RightArmMediumFast: 'RAMF',
    RightArmMedium: 'RAM',
    RightArmOffSpin: 'Off Spin',
    RightArmLegSpin: 'Leg Spin',
    LeftArmFast: 'LAF',
    LeftArmMediumFast: 'LAMF',
    LeftArmMedium: 'LAM',
    LeftArmOrthodox: 'Orthodox',
    LeftArmUnorthodox: 'Unorthodox',
  };
  return map[style] ?? style;
}
