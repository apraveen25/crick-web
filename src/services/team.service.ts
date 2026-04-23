import api from './api';
import {
  BattingStyleToInt, BattingStyleFromInt,
  BowlingStyleToInt, BowlingStyleFromInt,
  PlayerRoleToInt, PlayerRoleFromInt,
} from '@/utils/api-enums';
import type { Team, CreateTeamRequest, AddPlayerRequest, AddExistingPlayerRequest, TeamPlayer } from '@/types/team.types';

function mapPlayer(raw: Record<string, unknown>) {
  const roleRaw = raw.playerRole ?? raw.role;
  return {
    ...(raw as Record<string, unknown>),
    playerRole: PlayerRoleFromInt[roleRaw as number] ?? roleRaw,
    battingStyle: BattingStyleFromInt[raw.battingStyle as number] ?? raw.battingStyle,
    bowlingStyle: BowlingStyleFromInt[raw.bowlingStyle as number] ?? raw.bowlingStyle,
  };
}

function mapTeam(raw: Record<string, unknown>): Team {
  const players = ((raw.players ?? []) as Record<string, unknown>[]).map((tp) => ({
    ...tp,
    player: mapPlayer(tp.player as Record<string, unknown>),
  }));
  return { ...(raw as unknown as Team), players: players as TeamPlayer[] };
}

export const teamService = {
  async getTeams(): Promise<Team[]> {
    const response = await api.get<Record<string, unknown>[]>('/teams/my');
    return response.data.map(mapTeam);
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
    const payload = {
      ...data,
      role: PlayerRoleToInt[data.role],
      battingStyle: BattingStyleToInt[data.battingStyle],
      bowlingStyle: BowlingStyleToInt[data.bowlingStyle],
    };
    const response = await api.post<Record<string, unknown>>(`/teams/${teamId}/players`, payload);
    const tp = response.data as Record<string, unknown>;
    return { ...tp, player: mapPlayer(tp.player as Record<string, unknown>) } as TeamPlayer;
  },

  async addExistingPlayer(teamId: string, data: AddExistingPlayerRequest): Promise<TeamPlayer> {
    const response = await api.post<Record<string, unknown>>(`/teams/${teamId}/players`, data);
    const tp = response.data as Record<string, unknown>;
    return { ...tp, player: mapPlayer(tp.player as Record<string, unknown>) } as TeamPlayer;
  },
};
