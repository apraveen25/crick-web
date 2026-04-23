import api from './api';
import { MatchFormatToInt, MatchFormatFromInt, TossDecisionToInt } from '@/utils/api-enums';
import type { Match, CreateMatchRequest, StartMatchRequest } from '@/types/match.types';

function mapMatch(raw: Record<string, unknown>): Match {
  return {
    ...(raw as unknown as Match),
    format: (MatchFormatFromInt[raw.format as number] ?? raw.format) as Match['format'],
    status: ((raw.status as string)?.toLowerCase() ?? 'upcoming') as Match['status'],
    date: ((raw.scheduledAt ?? raw.date) as string) ?? '',
    totalOvers: ((raw.oversPerInnings ?? raw.totalOvers) as number) ?? 0,
  };
}

export const matchService = {
  async getMatches(): Promise<Match[]> {
    const response = await api.get<Record<string, unknown>[]>('/matches');
    return response.data.map(mapMatch);
  },

  async getMatch(id: string): Promise<Match> {
    const response = await api.get<Record<string, unknown>>(`/matches/${id}`);
    return mapMatch(response.data);
  },

  async createMatch(data: CreateMatchRequest): Promise<Match> {
    const payload = { ...data, format: MatchFormatToInt[data.format] };
    const response = await api.post<Record<string, unknown>>('/matches', payload);
    return mapMatch(response.data);
  },

  async startMatch(id: string, data: StartMatchRequest): Promise<Match> {
    const payload = {
      tossWinnerTeamId: data.tossWinnerTeamId,
      tossDecision: TossDecisionToInt[data.tossDecision],
    };
    const response = await api.post<Record<string, unknown>>(`/matches/${id}/start`, payload);
    return mapMatch(response.data);
  },
};
