import api from './api';
import type { Match, CreateMatchRequest, StartMatchRequest } from '@/types/match.types';

function normaliseStatus(raw: unknown): Match['status'] {
  const s = (raw as string)?.toLowerCase();
  if (s === 'live' || s === 'inprogress' || s === 'in_progress' || s === 'started') return 'live';
  if (s === 'completed' || s === 'finished') return 'completed';
  if (s === 'abandoned') return 'abandoned';
  return 'upcoming';
}

function mapMatch(raw: Record<string, unknown>): Match {
  return {
    ...(raw as unknown as Match),
    status: normaliseStatus(raw.status),
    date: ((raw.scheduledAt ?? raw.date) as string) ?? '',
    totalOvers: ((raw.oversPerInnings ?? raw.totalOvers) as number) ?? 0,
  };
}

export const matchService = {
  async getMatches(): Promise<Match[]> {
    const response = await api.get<Record<string, unknown>[]>('/matches');
    return response.data.map(mapMatch);
  },

  async getLiveMatches(): Promise<Match[]> {
    const all = await matchService.getMatches();
    return all.filter((m) => m.status === 'live');
  },

  async getRecentMatches(): Promise<Match[]> {
    const all = await matchService.getMatches();
    return all.filter((m) => m.status === 'completed');
  },

  async getMatch(id: string): Promise<Match> {
    const response = await api.get<Record<string, unknown>>(`/matches/${id}`);
    return mapMatch(response.data);
  },

  async createMatch(data: CreateMatchRequest): Promise<Match> {
    const response = await api.post<Record<string, unknown>>('/matches', data);
    return mapMatch(response.data);
  },

  async startMatch(id: string, data: StartMatchRequest): Promise<Match> {
    const response = await api.post<Record<string, unknown>>(`/matches/${id}/start`, data);
    return mapMatch(response.data);
  },
};
