'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Search, X, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Topbar } from '@/components/layout/Topbar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { teamService } from '@/services/team.service';
import { playerService } from '@/services/player.service';
import type { Player, PlayerRole, TeamPlayer, UpdateTeamPlayerRequest } from '@/types/team.types';

const roleBadgeVariant: Record<PlayerRole, 'blue' | 'green' | 'orange' | 'yellow'> = {
  Batsman: 'blue', Bowler: 'green', AllRounder: 'orange', WicketKeeper: 'yellow',
};

const roleLabel: Record<PlayerRole, string> = {
  Batsman: 'Batsman', Bowler: 'Bowler', AllRounder: 'All-Rounder', WicketKeeper: 'Keeper',
};

const roleOptions = [
  { value: 'Batsman', label: 'Batsman' },
  { value: 'Bowler', label: 'Bowler' },
  { value: 'AllRounder', label: 'All-Rounder' },
  { value: 'WicketKeeper', label: 'Wicket-Keeper' },
];


const emptyEditForm = (): UpdateTeamPlayerRequest => ({
  name: '', role: 'Batsman', isCaptain: false, isWicketKeeper: false,
});

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  // Add player modal state
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [isWicketKeeper, setIsWicketKeeper] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Edit player modal state
  const [editingTp, setEditingTp] = useState<TeamPlayer | null>(null);
  const [editForm, setEditForm] = useState<UpdateTeamPlayerRequest>(emptyEditForm());

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getTeam(id),
  });

  // Debounced search
  useEffect(() => {
    if (selectedPlayer || searchQuery.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await playerService.searchPlayers(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedPlayer]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addMutation = useMutation({
    mutationFn: () => teamService.addExistingPlayer(id, {
      playerId: selectedPlayer!.id,
      name: selectedPlayer!.name,
      role: selectedPlayer!.playerRole,
      isCaptain,
      isWicketKeeper,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Player added to team');
      handleAddClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setAddError(msg ?? 'Failed to add player');
    },
  });

  const editMutation = useMutation({
    mutationFn: () => teamService.updateTeamPlayer(id, editingTp!.playerId, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Player updated');
      setEditingTp(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to update player');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (playerId: string) => teamService.removePlayer(id, playerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', id] });
      toast.success('Player removed from team');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to remove player');
    },
  });

  const handleAddClose = () => {
    setShowAdd(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlayer(null);
    setShowDropdown(false);
    setIsCaptain(false);
    setIsWicketKeeper(false);
    setAddError(null);
  };

  const selectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setSearchQuery(player.name);
    setShowDropdown(false);
    setAddError(null);
  };

  const openEdit = (tp: TeamPlayer) => {
    setEditForm({
      name: tp.player.name ?? '',
      role: tp.player.playerRole ?? 'Batsman',
      isCaptain: tp.isCaptain ?? false,
      isWicketKeeper: tp.isWicketKeeper ?? false,
    });
    setEditingTp(tp);
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

      <div style={{ padding: '28px 32px 48px', maxWidth: 960 }}>
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
          <div style={{
            padding: '10px 18px', borderBottom: '1px solid var(--border)',
            display: 'grid', gridTemplateColumns: '36px 1fr 90px 90px 120px 100px 64px',
            gap: 12, fontSize: 11, color: 'var(--ink-3)', fontWeight: 600,
            background: 'var(--bg-sunken)', borderRadius: 'var(--radius) var(--radius) 0 0',
          }}>
            <span>#</span>
            <span>PLAYER</span>
            <span>ROLE</span>
            <span>BATTING</span>
            <span>BOWLING</span>
            <span>NATIONALITY</span>
            <span></span>
          </div>

          {team.players.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
              No players yet. Add your first player.
            </div>
          ) : (
            team.players.filter((tp) => tp.player).map((tp, i, arr) => {
              const p = tp.player;
              const jerseyNo = tp.jerseyNumber ?? p.jerseyNumber;
              return (
                <div
                  key={tp.playerId}
                  style={{
                    display: 'grid', gridTemplateColumns: '36px 1fr 90px 90px 120px 100px 64px',
                    gap: 12, alignItems: 'center', padding: '12px 18px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
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
                    <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p.name}
                      {tp.isCaptain && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 5px', borderRadius: 4 }}>C</span>}
                      {tp.isWicketKeeper && <span style={{ fontSize: 10, fontWeight: 600, color: 'oklch(38% 0.14 75)', background: 'var(--warn-soft)', padding: '1px 5px', borderRadius: 4 }}>WK</span>}
                    </div>
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
                    {p.battingStyle === 'RightHanded' ? 'Right' : p.battingStyle === 'LeftHanded' ? 'Left' : '—'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {formatBowlingStyle(p.bowlingStyle)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    {p.nationality ?? '—'}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => openEdit(tp)}
                      title="Edit player"
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-4)' }}
                      className="hover:bg-[var(--bg-hover)] hover:text-[var(--ink)]"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${p.name} from ${team.name}?`)) {
                          removeMutation.mutate(tp.playerId);
                        }
                      }}
                      title="Remove from team"
                      style={{ padding: 6, borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink-4)' }}
                      className="hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Player Modal */}
      <Modal open={showAdd} onClose={handleAddClose} title="Add player to team" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
              Search player
            </label>
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                border: `1px solid ${selectedPlayer ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)',
                padding: '0 10px', height: 38,
              }}>
                <Search size={13} style={{ color: 'var(--ink-4)', flexShrink: 0 }} />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedPlayer) setSelectedPlayer(null);
                  }}
                  placeholder="Type at least 3 characters…"
                  style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 13, color: 'var(--ink)' }}
                />
                {isSearching && (
                  <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>Searching…</span>
                )}
                {selectedPlayer && (
                  <button
                    onClick={() => { setSelectedPlayer(null); setSearchQuery(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex', padding: 2 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {showDropdown && !selectedPlayer && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow)',
                  maxHeight: 220, overflowY: 'auto',
                }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ink-3)' }}>
                      No players found for &ldquo;{searchQuery}&rdquo;
                    </div>
                  ) : (
                    searchResults.map((player, i) => (
                      <button
                        key={player.id}
                        onMouseDown={() => selectPlayer(player)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left',
                          borderBottom: i < searchResults.length - 1 ? '1px solid var(--border)' : 'none',
                        }}
                        className="hover:bg-[var(--bg-hover)]"
                      >
                        <div style={{
                          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--accent-soft)', border: '1.5px solid var(--accent)',
                          display: 'grid', placeItems: 'center',
                          fontSize: 10, fontWeight: 700, color: 'oklch(35% 0.13 150)',
                        }}>
                          {player.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{player.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                            {roleLabel[player.playerRole] ?? player.playerRole} · {player.nationality}
                          </div>
                        </div>
                        {player.jerseyNumber != null && (
                          <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>#{player.jerseyNumber}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {!selectedPlayer && searchQuery.length > 0 && searchQuery.length < 3 && (
              <p style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 5 }}>
                Type {3 - searchQuery.length} more character{3 - searchQuery.length !== 1 ? 's' : ''} to search…
              </p>
            )}
          </div>

          {selectedPlayer && (
            <div style={{
              padding: '12px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-soft)', border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'white', border: '2px solid var(--accent)',
                display: 'grid', placeItems: 'center',
                fontSize: 12, fontWeight: 700, color: 'oklch(35% 0.13 150)',
              }}>
                {selectedPlayer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{selectedPlayer.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                  {roleLabel[selectedPlayer.playerRole] ?? selectedPlayer.playerRole}
                  {' · '}
                  {selectedPlayer.battingStyle === 'RightHanded' ? 'Right Handed' : 'Left Handed'}
                  {' · '}
                  {selectedPlayer.nationality}
                </div>
              </div>
              <Badge variant={roleBadgeVariant[selectedPlayer.playerRole]}>
                {roleLabel[selectedPlayer.playerRole]}
              </Badge>
            </div>
          )}

          {selectedPlayer && (
            <>
              <div style={{ display: 'flex', gap: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isCaptain} onChange={(e) => setIsCaptain(e.target.checked)} />
                  Captain
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isWicketKeeper} onChange={(e) => setIsWicketKeeper(e.target.checked)} />
                  Wicket-Keeper
                </label>
              </div>
            </>
          )}

          {addError && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-soft)', border: '1px solid var(--danger)',
              fontSize: 13, color: 'var(--danger)',
            }}>
              {addError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Button type="button" variant="secondary" onClick={handleAddClose}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate()}
              loading={addMutation.isPending}
              disabled={!selectedPlayer}
            >
              Add to team
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Player Modal */}
      <Modal open={!!editingTp} onClose={() => setEditingTp(null)} title="Edit player" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Name"
            value={editForm.name ?? ''}
            onChange={(e) => setEditForm((f: UpdateTeamPlayerRequest) => ({ ...f, name: e.target.value }))}
          />
          <Select
            label="Role"
            options={roleOptions}
            value={editForm.role}
            onChange={(e) => setEditForm((f: UpdateTeamPlayerRequest) => ({ ...f, role: e.target.value as PlayerRole }))}
          />
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editForm.isCaptain ?? false} onChange={(e) => setEditForm((f: UpdateTeamPlayerRequest) => ({ ...f, isCaptain: e.target.checked }))} />
              Captain
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
              <input type="checkbox" checked={editForm.isWicketKeeper ?? false} onChange={(e) => setEditForm((f: UpdateTeamPlayerRequest) => ({ ...f, isWicketKeeper: e.target.checked }))} />
              Wicket-Keeper
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <Button type="button" variant="secondary" onClick={() => setEditingTp(null)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} loading={editMutation.isPending}>
              Save changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function formatBowlingStyle(style: string): string {
  const map: Record<string, string> = {
    None: '—', RightArmFast: 'RAF', RightArmMediumFast: 'RAMF', RightArmMedium: 'RAM',
    RightArmOffSpin: 'Off Spin', RightArmLegSpin: 'Leg Spin', LeftArmFast: 'LAF',
    LeftArmMediumFast: 'LAMF', LeftArmMedium: 'LAM', LeftArmOrthodox: 'Orthodox',
    LeftArmUnorthodox: 'Unorthodox',
  };
  return map[style] ?? style ?? '—';
}
