import api from './api';
import type { Team, CreateTeamRequest, AddPlayerRequest, AddExistingPlayerRequest, UpdateTeamPlayerRequest, RearrangePlayersRequest, TeamPlayer } from '@/types/team.types';

function mapPlayer(raw: Record<string, unknown>) {
  return {
    ...(raw as Record<string, unknown>),
    playerRole: raw.playerRole ?? raw.role,
  };
}

function mapTeam(raw: Record<string, unknown>): Team {
  const players = ((raw.players ?? []) as Record<string, unknown>[]).map((tp) => {
    // API returns a flat shape: { playerId, name, role, isCaptain, isWicketKeeper, ... }
    // with no nested `player` sub-object. Build one from the flat fields.
    const player = tp.player
      ? mapPlayer(tp.player as Record<string, unknown>)
      : mapPlayer({
          id: tp.playerId,
          name: tp.name,
          playerRole: tp.playerRole,
          role: tp.role,
          battingStyle: tp.battingStyle,
          bowlingStyle: tp.bowlingStyle,
          dateOfBirth: tp.dateOfBirth,
          nationality: tp.nationality,
          jerseyNumber: tp.jerseyNumber,
        });
    return { teamId: tp.teamId, playerId: tp.playerId, isCaptain: tp.isCaptain, isWicketKeeper: tp.isWicketKeeper, jerseyNumber: tp.jerseyNumber, player };
  });
  return { ...(raw as unknown as Team), players: players as TeamPlayer[] };
}

export const teamService = {
  async getTeams(): Promise<Team[]> {
    const response = await api.get<unknown>('/teams/my');
    const raw = response.data;
    const list = Array.isArray(raw) ? raw : ((raw as Record<string, unknown>)?.items ?? (raw as Record<string, unknown>)?.teams ?? (raw as Record<string, unknown>)?.data ?? []);
    return (list as Record<string, unknown>[]).map(mapTeam);
  },

  async getTeam(id: string): Promise<Team> {
    const response = await api.get<Record<string, unknown>>(`/teams/${id}`);
    return mapTeam(response.data);
  },

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await api.post<Record<string, unknown>>('/teams', data);
    return mapTeam(response.data);
  },

  async addPlayer(teamId: string, data: AddPlayerRequest): Promise<TeamPlayer> {
    const response = await api.post<Record<string, unknown>>(`/teams/${teamId}/players`, data);
    return mapTeam({ players: [response.data] }).players[0];
  },

  async addExistingPlayer(teamId: string, data: AddExistingPlayerRequest): Promise<TeamPlayer> {
    const response = await api.post<Record<string, unknown>>(`/teams/${teamId}/players`, data);
    return mapTeam({ players: [response.data] }).players[0];
  },

  async updateTeamPlayer(teamId: string, playerId: string, data: UpdateTeamPlayerRequest): Promise<TeamPlayer> {
    const response = await api.put<Record<string, unknown>>(`/teams/${teamId}/players/${playerId}`, data);
    return mapTeam({ players: [response.data] }).players[0];
  },

  async rearrangePlayers(teamId: string, data: RearrangePlayersRequest): Promise<void> {
    await api.put(`/teams/${teamId}/players/rearrange`, data);
  },

  async removePlayer(teamId: string, playerId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/players/${playerId}`);
  },
};
