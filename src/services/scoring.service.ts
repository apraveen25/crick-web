import api from './api';
import type {
  LiveScore,
  DeliverBallRequest,
  BallRecord,
  ChangeBowlerRequest,
  SwapBatsmanRequest,
} from '@/types/scoring.types';

export const scoringService = {
  async getLiveScore(matchId: string): Promise<LiveScore> {
    const response = await api.get<LiveScore>(`/matches/${matchId}/live`);
    return response.data;
  },

  async deliverBall(data: DeliverBallRequest): Promise<BallRecord> {
    const response = await api.post<BallRecord>(`/innings/${data.inningId}/balls`, data);
    return response.data;
  },

  async undoLastBall(inningId: string): Promise<void> {
    await api.delete(`/innings/${inningId}/balls/last`);
  },

  async changeBowler(inningId: string, data: ChangeBowlerRequest): Promise<void> {
    await api.post(`/innings/${inningId}/bowler`, data);
  },

  async swapBatsman(inningId: string, data: SwapBatsmanRequest): Promise<void> {
    await api.post(`/innings/${inningId}/batsman/swap`, data);
  },

  async getOverHistory(inningId: string): Promise<BallRecord[]> {
    const response = await api.get<BallRecord[]>(`/innings/${inningId}/balls`);
    return response.data;
  },
};
