'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { teamService } from '@/services/team.service';
import { matchService } from '@/services/match.service';
import type { CreateMatchRequest, MatchFormat } from '@/types/match.types';

const formats: MatchFormat[] = ['T20', 'ODI', 'Test', 'Custom'];
const defaultOvers: Record<MatchFormat, number> = { T20: 20, ODI: 50, Test: 90, Custom: 20 };

export default function NewMatchPage() {
  const router = useRouter();
  const [form, setForm] = useState<CreateMatchRequest>({
    name: '',
    format: 'T20',
    venue: '',
    date: new Date().toISOString().slice(0, 16),
    team1Id: '',
    team2Id: '',
    totalOvers: 20,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: teams = [] } = useQuery({ queryKey: ['teams'], queryFn: teamService.getTeams });

  const mutation = useMutation({
    mutationFn: matchService.createMatch,
    onSuccess: (match) => {
      toast.success('Match created!');
      router.push(`/matches/${match.id}`);
    },
    onError: () => toast.error('Failed to create match'),
  });

  const teamOptions = teams.map((t) => ({ value: t.id, label: t.name }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Match name is required';
    if (!form.team1Id) e.team1Id = 'Select home team';
    if (!form.team2Id) e.team2Id = 'Select away team';
    if (form.team1Id && form.team1Id === form.team2Id) e.team2Id = 'Teams must be different';
    if (!form.venue.trim()) e.venue = 'Venue is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  };

  const setFormat = (f: MatchFormat) => {
    setForm((prev) => ({ ...prev, format: f, totalOvers: defaultOvers[f] }));
  };

  return (
    <>
      <Topbar crumbs={['Matches', 'New match']} />

      <div style={{ padding: '28px 32px 48px', maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
              New match
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-3)', fontSize: 14 }}>
              Configure teams, format, and rules.
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={handleSubmit} loading={mutation.isPending}>
              <Zap size={14} /> Create match
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
            {/* Left: main config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Teams */}
              <SectionCard title="Teams">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 18px' }}>
                  <Select
                    label="Home team"
                    options={teamOptions}
                    placeholder="Select team"
                    value={form.team1Id}
                    onChange={(e) => setForm((f) => ({ ...f, team1Id: e.target.value }))}
                    error={errors.team1Id}
                  />
                  <Select
                    label="Away team"
                    options={teamOptions}
                    placeholder="Select team"
                    value={form.team2Id}
                    onChange={(e) => setForm((f) => ({ ...f, team2Id: e.target.value }))}
                    error={errors.team2Id}
                  />
                </div>
              </SectionCard>

              {/* Format & rules */}
              <SectionCard title="Format & rules">
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
                      Match format
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {formats.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFormat(f)}
                          style={{
                            padding: '6px 16px', borderRadius: 'var(--radius-sm)',
                            fontSize: 13, fontWeight: 500, cursor: 'pointer',
                            border: '1.5px solid',
                            borderColor: form.format === f ? 'var(--accent)' : 'var(--border)',
                            background: form.format === f ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                            color: form.format === f ? 'oklch(35% 0.13 150)' : 'var(--ink-2)',
                            transition: 'all var(--duration) var(--ease)',
                          }}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Input
                      label="Overs per innings"
                      type="number"
                      value={form.totalOvers}
                      onChange={(e) => setForm((f) => ({ ...f, totalOvers: Number(e.target.value) }))}
                      min={1}
                    />
                    <Input
                      label="Venue"
                      placeholder="Riverside Oval"
                      value={form.venue}
                      onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                      error={errors.venue}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Input
                      label="Match name"
                      placeholder="VEL vs SRK — T20 Final"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      error={errors.name}
                    />
                    <Input
                      label="Date & time"
                      type="datetime-local"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Right: preview */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SectionCard title="Preview">
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <FormatChip>{form.format}</FormatChip>
                    {form.venue && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{form.venue}</span>}
                  </div>
                  <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
                    {(form.team1Id && teams.find((t) => t.id === form.team1Id)?.name) || 'Team A'}{' '}
                    <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>vs</span>{' '}
                    {(form.team2Id && teams.find((t) => t.id === form.team2Id)?.name) || 'Team B'}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 12 }}>
                    <span style={{ color: 'var(--ink-3)' }}>Overs</span>
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{form.totalOvers}</span>
                    <span style={{ color: 'var(--ink-3)' }}>Free hit</span>
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>Enabled</span>
                    <span style={{ color: 'var(--ink-3)' }}>Format</span>
                    <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{form.format}</span>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FormatChip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 999,
      fontSize: 11, fontWeight: 500,
      background: 'var(--accent-soft)', color: 'oklch(35% 0.13 150)',
      border: 'none',
    }}>
      {children}
    </span>
  );
}
