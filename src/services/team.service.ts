import api from './api';
import type { Team, CreateTeamRequest, AddPlayerRequest, Player, TeamPlayer } from '@/types/team.types';

export const teamService = {
  async getTeams(): Promise<Team[]> {
    const response = await api.get<Team[]>('/teams/my');
    return response.data;
  },

  async getTeam(id: string): Promise<Team> {
    const response = await api.get<Team>(`/teams/${id}`);
    return response.data;
  },

  async createTeam(data: CreateTeamRequest): Promise<Team> {
    const response = await api.post<Team>('/teams', data);
    return response.data;
  },

  async updateTeam(id: string, data: Partial<CreateTeamRequest>): Promise<Team> {
    const response = await api.put<Team>(`/teams/${id}`, data);
    return response.data;
  },

  async deleteTeam(id: string): Promise<void> {
    await api.delete(`/teams/${id}`);
  },

  async addPlayer(teamId: string, data: AddPlayerRequest): Promise<TeamPlayer> {
    const response = await api.post<TeamPlayer>(`/teams/${teamId}/players`, data);
    return response.data;
  },

  async updatePlayer(teamId: string, playerId: string, data: Partial<AddPlayerRequest>): Promise<Player> {
    const response = await api.put<Player>(`/teams/${teamId}/players/${playerId}`, data);
    return response.data;
  },

  async removePlayer(teamId: string, playerId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/players/${playerId}`);
  },
};
