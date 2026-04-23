'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, Users, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { teamService } from '@/services/team.service';
import type { CreateTeamRequest } from '@/types/team.types';

export default function TeamsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateTeamRequest>({ name: '', shortName: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: teamService.getTeams,
  });

  const createMutation = useMutation({
    mutationFn: teamService.createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created');
      setShowCreate(false);
      setForm({ name: '', shortName: '' });
    },
    onError: () => toast.error('Failed to create team'),
  });

  const deleteMutation = useMutation({
    mutationFn: teamService.deleteTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted');
    },
    onError: () => toast.error('Failed to delete team'),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Team name is required';
    if (!form.shortName.trim()) e.shortName = 'Short name is required';
    else if (form.shortName.length > 4) e.shortName = 'Max 4 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate({ ...form, shortName: form.shortName.toUpperCase() });
  };

  return (
    <>
      <Topbar
        crumbs={['CrickScore', 'Teams']}
        right={
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={14} /> New team
          </Button>
        }
      />

      <div style={{ padding: '28px 32px 48px', maxWidth: 900 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>Teams</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>Manage rosters and player details.</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 80, borderRadius: 'var(--radius)', background: 'var(--bg-sunken)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No teams yet"
            description="Create your first team to start managing players and matches."
            action={{ label: 'Create team', onClick: () => setShowCreate(true) }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {teams.map((team) => (
              <div
                key={team.id}
                style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)',
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                  cursor: 'pointer', transition: 'all var(--duration) var(--ease)',
                  position: 'relative',
                }}
                onClick={() => router.push(`/teams/${team.id}`)}
                className="hover:shadow-md hover:border-[var(--border-strong)]"
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--accent-soft)', border: '1.5px solid var(--accent)',
                  display: 'grid', placeItems: 'center',
                  fontSize: 13, fontWeight: 700,
                  color: 'oklch(35% 0.13 150)', flexShrink: 0,
                  letterSpacing: '-0.01em',
                }}>
                  {team.shortName.slice(0, 3)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', marginBottom: 2 }}>
                    {team.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this team?')) deleteMutation.mutate(team.id); }}
                    style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-4)' }}
                    className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} style={{ color: 'var(--ink-4)' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create team">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Team name"
            placeholder="Velocity XI"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={errors.name}
          />
          <Input
            label="Short name (2–4 chars)"
            placeholder="VEL"
            value={form.shortName}
            onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value.toUpperCase() }))}
            error={errors.shortName}
            maxLength={4}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending}>Create team</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
