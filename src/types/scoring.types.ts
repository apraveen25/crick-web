export type BallType = 'normal' | 'wide' | 'no_ball' | 'bye' | 'leg_bye';
export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'obstructing_field'
  | 'handled_ball'
  | 'timed_out';

export interface BallRecord {
  id: string;
  inningId: string;
  overNumber: number;
  ballNumber: number;
  batsmanId: string;
  batsmanName: string;
  bowlerId: string;
  bowlerName: string;
  runs: number;
  ballType: BallType;
  isWicket: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  dismissedPlayerName?: string;
  fielderId?: string;
  fielderName?: string;
  commentary?: string;
}

export interface DeliverBallRequest {
  inningId: string;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  ballType: BallType;
  isWicket: boolean;
  wicketType?: WicketType;
  dismissedPlayerId?: string;
  fielderId?: string;
}

export interface ChangeBowlerRequest {
  bowlerId: string;
}

export interface SwapBatsmanRequest {
  newBatsmanId: string;
}

export interface LiveScore {
  matchId: string;
  currentInning: number;
  battingTeamId: string;
  battingTeamName: string;
  bowlingTeamId: string;
  bowlingTeamName: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  runRate: number;
  requiredRunRate?: number;
  target?: number;
  striker: ActiveBatsman;
  nonStriker: ActiveBatsman;
  currentBowler: ActiveBowler;
  lastSixBalls: BallRecord[];
  recentOvers: RecentOver[];
}

export interface ActiveBatsman {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
}

export interface ActiveBowler {
  playerId: string;
  playerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface RecentOver {
  overNumber: number;
  runs: number;
  wickets: number;
  balls: string[];
}
