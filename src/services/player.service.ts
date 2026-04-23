import api from './api';
import type { Player, AddPlayerRequest } from '@/types/team.types';

export const playerService = {
  async getPlayers(): Promise<Player[]> {
    const response = await api.get<Player[]>('/players');
    return response.data;
  },

  async getPlayer(id: string): Promise<Player> {
    const response = await api.get<Player>(`/players/${id}`);
    return response.data;
  },

  async createPlayer(data: AddPlayerRequest): Promise<Player> {
    const response = await api.post<Player>('/players', data);
    return response.data;
  },

  async updatePlayer(id: string, data: Partial<AddPlayerRequest>): Promise<Player> {
    const response = await api.put<Player>(`/players/${id}`, data);
    return response.data;
  },

  async deletePlayer(id: string): Promise<void> {
    await api.delete(`/players/${id}`);
  },
};
