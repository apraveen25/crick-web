import api from './api';
import type { Match, CreateMatchRequest, TossRequest, StartInningRequest } from '@/types/match.types';

export const matchService = {
  async getMatches(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches');
    return response.data;
  },

  async getLiveMatches(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches?status=live');
    return response.data;
  },

  async getRecentMatches(): Promise<Match[]> {
    const response = await api.get<Match[]>('/matches?status=completed&limit=5');
    return response.data;
  },

  async getMatch(id: string): Promise<Match> {
    const response = await api.get<Match>(`/matches/${id}`);
    return response.data;
  },

  async createMatch(data: CreateMatchRequest): Promise<Match> {
    const response = await api.post<Match>('/matches', data);
    return response.data;
  },

  async updateMatch(id: string, data: Partial<CreateMatchRequest>): Promise<Match> {
    const response = await api.put<Match>(`/matches/${id}`, data);
    return response.data;
  },

  async setToss(id: string, data: TossRequest): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/toss`, data);
    return response.data;
  },

  async startInning(matchId: string, inningId: string, data: StartInningRequest): Promise<Match> {
    const response = await api.post<Match>(`/matches/${matchId}/innings/${inningId}/start`, data);
    return response.data;
  },

  async endMatch(id: string): Promise<Match> {
    const response = await api.post<Match>(`/matches/${id}/end`);
    return response.data;
  },
};
