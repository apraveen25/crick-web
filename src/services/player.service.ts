import api from './api';
import type { Player, CreatePlayerRequest, UpdatePlayerRequest } from '@/types/team.types';

function mapPlayer(raw: Record<string, unknown>): Player {
  return {
    ...(raw as unknown as Player),
    playerRole: (raw.playerRole ?? raw.role) as Player['playerRole'],
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
    const response = await api.post<Record<string, unknown>>('/players', data);
    return mapPlayer(response.data);
  },

  async searchPlayers(name: string): Promise<Player[]> {
    const response = await api.get<Record<string, unknown>[]>('/players/search', { params: { name } });
    return response.data.map(mapPlayer);
  },

  async updatePlayer(id: string, data: UpdatePlayerRequest): Promise<Player> {
    const response = await api.put<Record<string, unknown>>(`/players/${id}`, data);
    return mapPlayer(response.data);
  },
};
