import api from './api';
import type { LiveScore, DeliverBallRequest, BallRecord } from '@/types/scoring.types';

const extraToBallType: Record<string, string> = {
  None: 'normal', Wide: 'wide', NoBall: 'no_ball', Bye: 'bye', LegBye: 'leg_bye',
};

export const scoringService = {
  async getLiveScore(matchId: string): Promise<LiveScore> {
    const response = await api.get<LiveScore>(`/live/${matchId}/state`);
    return response.data;
  },

  async deliverBall(matchId: string, data: DeliverBallRequest): Promise<BallRecord> {
    const payload = {
      ...data,
      wicketType: data.wicketType ?? 'None',
    };
    const response = await api.post<Record<string, unknown>>(`/live/${matchId}/ball`, payload);
    const raw = response.data;
    return {
      ...(raw as unknown as BallRecord),
      ballType: extraToBallType[raw.extraType as string] ?? 'normal',
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
