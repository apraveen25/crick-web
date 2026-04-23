import api from './api';
import { ExtraTypeToInt, WicketTypeToInt } from '@/utils/api-enums';
import type { LiveScore, DeliverBallRequest, BallRecord } from '@/types/scoring.types';

const extraToBallType: Record<number, string> = {
  0: 'normal', 1: 'wide', 2: 'no_ball', 3: 'bye', 4: 'leg_bye',
};

export const scoringService = {
  async getLiveScore(matchId: string): Promise<LiveScore> {
    const response = await api.get<LiveScore>(`/live/${matchId}/state`);
    return response.data;
  },

  async deliverBall(matchId: string, data: DeliverBallRequest): Promise<BallRecord> {
    const payload = {
      ...data,
      extraType: ExtraTypeToInt[data.extraType] ?? 0,
      wicketType: data.wicketType !== undefined ? WicketTypeToInt[data.wicketType] : 0,
    };
    const response = await api.post<Record<string, unknown>>(`/live/${matchId}/ball`, payload);
    const raw = response.data;
    return {
      ...(raw as unknown as BallRecord),
      ballType: extraToBallType[raw.extraType as number] ?? 'normal',
      runs: ((raw.runsScored as number) ?? 0) + ((raw.extraRuns as number) ?? 0),
    };
  },

  async undoLastBall(matchId: string): Promise<void> {
    await api.post(`/live/${matchId}/undo`);
  },

  async getScorecard(matchId: string): Promise<unknown> {
    const response = await api.get(`/matches/${matchId}/scorecard`);
    return response.data;
  },
};
