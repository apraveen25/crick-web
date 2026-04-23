import api from './api';
import {
  BattingStyleToInt, BattingStyleFromInt,
  BowlingStyleToInt, BowlingStyleFromInt,
  PlayerRoleToInt, PlayerRoleFromInt,
} from '@/utils/api-enums';
import type { Player, CreatePlayerRequest, UpdatePlayerRequest } from '@/types/team.types';

function mapPlayer(raw: Record<string, unknown>): Player {
  const roleRaw = raw.playerRole ?? raw.role;
  return {
    ...(raw as unknown as Player),
    playerRole: (PlayerRoleFromInt[roleRaw as number] ?? roleRaw) as Player['playerRole'],
    battingStyle: (BattingStyleFromInt[raw.battingStyle as number] ?? raw.battingStyle) as Player['battingStyle'],
    bowlingStyle: (BowlingStyleFromInt[raw.bowlingStyle as number] ?? raw.bowlingStyle) as Player['bowlingStyle'],
  };
}

export const playerService = {
  async getPlayers(search?: string): Promise<Player[]> {
    const params = search ? { search } : {};
    const response = await api.get<Record<string, unknown>[]>('/players', { params });
    return response.data.map(mapPlayer);
  },

  async getPlayer(id: string): Promise<Player> {
    const response = await api.get<Record<string, unknown>>(`/players/${id}`);
    return mapPlayer(response.data);
  },

  async createPlayer(data: CreatePlayerRequest): Promise<Player> {
    const payload = {
      ...data,
      playerRole: PlayerRoleToInt[data.playerRole],
      battingStyle: BattingStyleToInt[data.battingStyle],
      bowlingStyle: BowlingStyleToInt[data.bowlingStyle],
    };
    const response = await api.post<Record<string, unknown>>('/players', payload);
    return mapPlayer(response.data);
  },

  async searchPlayers(name: string): Promise<Player[]> {
    const response = await api.get<Record<string, unknown>[]>('/players/search', { params: { name } });
    return response.data.map(mapPlayer);
  },

  async updatePlayer(id: string, data: UpdatePlayerRequest): Promise<Player> {
    const payload = {
      ...data,
      role: PlayerRoleToInt[data.role],
      battingStyle: BattingStyleToInt[data.battingStyle],
      bowlingStyle: BowlingStyleToInt[data.bowlingStyle],
    };
    const response = await api.put<Record<string, unknown>>(`/players/${id}`, payload);
    return mapPlayer(response.data);
  },
};
