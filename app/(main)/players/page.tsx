'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Search, UserCircle, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { playerService } from '@/services/player.service';
import type {
  AddPlayerRequest, PlayerRole, BattingStyle, BowlingStyle,
} from '@/types/team.types';

// ── Option arrays ──────────────────────────────────────────────────────────

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

const emptyForm: AddPlayerRequest = {
  name: '',
  dateOfBirth: '',
  nationality: '',
  battingStyle: 'RightHanded',
  bowlingStyle: 'None',
  playerRole: 'Batsman',
  jerseyNumber: undefined,
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function PlayersPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<AddPlayerRequest>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter state
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<PlayerRole | ''>('');
  const [filterBatting, setFilterBatting] = useState<BattingStyle | ''>('');

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: playerService.getPlayers,
  });

  const createMutation = useMutation({
    mutationFn: playerService.createPlayer,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['players'] });
      toast.success('Player created');
      setShowCreate(false);
      setForm(emptyForm);
      router.push(`/players/${created.id}`);
    },
    onError: () => toast.error('Failed to create player'),
  });

  const deleteMutation = useMutation({
    mutationFn: playerService.deletePlayer,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
      toast.success('Player deleted');
    },
    onError: () => toast.error('Failed to delete player'),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    if (!form.nationality.trim()) e.nationality = 'Nationality is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate(form);
  };

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || p.name.toLowerCase().includes(q)
        || p.nationality.toLowerCase().includes(q);
      const matchRole = !filterRole || p.playerRole === filterRole;
      const matchBatting = !filterBatting || p.battingStyle === filterBatting;
      return matchSearch && matchRole && matchBatting;
    });
  }, [players, search, filterRole, filterBatting]);

  return (
    <>
      <Topbar
        crumbs={['CrickScore', 'Players']}
        right={
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={14} /> New player
          </Button>
        }
      />

      <div style={{ padding: '28px 32px 48px', maxWidth: 1100 }}>
        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            Players
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>
            Global player registry — a player can be added to multiple teams.
          </p>
        </div>

        {/* Search + filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-end' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flex: 1, maxWidth: 320,
            padding: '0 10px', height: 36,
            border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
          }}>
            <Search size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
            <input
              placeholder="Search by name or nationality…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 0, outline: 0, background: 'transparent', fontSize: 13, color: 'var(--ink)', width: '100%' }}
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as PlayerRole | '')}
            style={filterSelectStyle}
          >
            <option value="">All roles</option>
            {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={filterBatting}
            onChange={(e) => setFilterBatting(e.target.value as BattingStyle | '')}
            style={filterSelectStyle}
          >
            <option value="">All batting</option>
            {battingStyleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {(search || filterRole || filterBatting) && (
            <button
              onClick={() => { setSearch(''); setFilterRole(''); setFilterBatting(''); }}
              style={{ fontSize: 12, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}
              className="hover:text-[var(--ink)]"
            >
              Clear
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)', alignSelf: 'center' }}>
            {filtered.length} of {players.length} player{players.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Player table */}
        {isLoading ? (
          <SkeletonTable />
        ) : players.length === 0 ? (
          <EmptyState
            icon={UserCircle}
            title="No players yet"
            description="Create your first player. Players can be added to multiple teams."
            action={{ label: 'New player', onClick: () => setShowCreate(true) }}
          />
        ) : filtered.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13,
            border: '1px dashed var(--border)', borderRadius: 'var(--radius)',
          }}>
            No players match your filters.
          </div>
        ) : (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 110px 140px 110px 80px',
              gap: 12, padding: '10px 18px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-sunken)',
              borderRadius: 'var(--radius) var(--radius) 0 0',
              fontSize: 11, fontWeight: 600, color: 'var(--ink-3)',
            }}>
              <span>PLAYER</span>
              <span>ROLE</span>
              <span>BATTING</span>
              <span>BOWLING</span>
              <span>NATIONALITY</span>
              <span />
            </div>

            {filtered.map((player, i) => (
              <div
                key={player.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 100px 110px 140px 110px 80px',
                  gap: 12, padding: '12px 18px', alignItems: 'center',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', transition: 'background var(--duration) var(--ease)',
                }}
                className="hover:bg-[var(--bg-hover)]"
                onClick={() => router.push(`/players/${player.id}`)}
              >
                {/* Name + DOB */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--accent-soft)', border: '1.5px solid var(--accent)',
                    display: 'grid', placeItems: 'center',
                    fontSize: 12, fontWeight: 700, color: 'oklch(35% 0.13 150)',
                  }}>
                    {player.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{player.name}</div>
                    {player.dateOfBirth && (
                      <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 1 }}>
                        {formatDOB(player.dateOfBirth)}
                      </div>
                    )}
                  </div>
                </div>

                <Badge variant={roleBadge[player.playerRole]}>
                  {roleLabel(player.playerRole)}
                </Badge>

                <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  {player.battingStyle === 'RightHanded' ? 'Right Handed' : 'Left Handed'}
                </span>

                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  {bowlingLabel(player.bowlingStyle)}
                </span>

                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  {player.nationality}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete ${player.name}? This cannot be undone.`)) {
                        deleteMutation.mutate(player.id);
                      }
                    }}
                    style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-4)' }}
                    className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={15} style={{ color: 'var(--ink-4)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm(emptyForm); }} title="New player" size="lg">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          <Select
            label="Bowling style"
            options={bowlingStyleOptions}
            value={form.bowlingStyle}
            onChange={(e) => setForm((f) => ({ ...f, bowlingStyle: e.target.value as BowlingStyle }))}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setForm(emptyForm); }}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create player</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function roleLabel(role: PlayerRole): string {
  return { Batsman: 'Batsman', Bowler: 'Bowler', AllRounder: 'All-Rounder', WicketKeeper: 'Keeper' }[role];
}

function bowlingLabel(style: BowlingStyle): string {
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

function formatDOB(dob: string): string {
  return new Date(dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function SkeletonTable() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ height: 56, background: 'var(--bg-sunken)', opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

const filterSelectStyle: React.CSSProperties = {
  height: 36, padding: '0 10px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', background: 'var(--bg-elevated)',
  fontSize: 13, color: 'var(--ink)', outline: 'none', cursor: 'pointer',
};
