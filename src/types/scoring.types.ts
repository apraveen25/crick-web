// Extra type — None means a normal delivery
export type ExtraType = 'None' | 'Wide' | 'NoBall' | 'Bye' | 'LegBye';

// Mode of dismissal
export type WicketType =
  | 'Bowled'
  | 'Caught'
  | 'RunOut'
  | 'Stumped'
  | 'LBW'
  | 'HitWicket'
  | 'ObstructingField'
  | 'TimedOut'
  | 'DoubleHit';

// POST /live/{matchId}/ball
export interface DeliverBallRequest {
  batsmanId: string;
  bowlerId: string;
  runsScored: number;
  extraType: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType;
  fielderId?: string;
  dismissedBatsmanId?: string;
  nextBatsmanId?: string;
  nextBowlerId?: string;
}

// Ball record returned in GET /live/{matchId}/state → lastSixBalls
export interface BallRecord {
  id: string;
  overNumber: number;
  ballNumber: number;
  batsmanId: string;
  batsmanName: string;
  bowlerId: string;
  bowlerName: string;
  runs: number;
  ballType: string;
  isWicket: boolean;
  wicketType?: string;
  dismissedPlayerId?: string;
  dismissedPlayerName?: string;
  fielderId?: string;
  fielderName?: string;
  commentary?: string;
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

// GET /live/{matchId}/state
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
