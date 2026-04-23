export type MatchFormat = 'T20' | 'ODI' | 'Test' | 'Custom';
export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned';
export type InningStatus = 'not_started' | 'in_progress' | 'completed';

export interface Match {
  id: string;
  name: string;
  format: MatchFormat;
  venue: string;
  date: string;
  status: MatchStatus;
  team1Id: string;
  team2Id: string;
  team1Name: string;
  team2Name: string;
  team1ShortName: string;
  team2ShortName: string;
  tossWinnerId?: string;
  tossDecision?: 'bat' | 'bowl';
  currentInning?: number;
  totalOvers: number;
  innings: Inning[];
  result?: string;
  createdAt: string;
}

export interface Inning {
  id: string;
  matchId: string;
  teamId: string;
  teamName: string;
  inningNumber: 1 | 2;
  status: InningStatus;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: Extras;
  runRate: number;
  requiredRunRate?: number;
  target?: number;
  battingScores: BattingScore[];
  bowlingFigures: BowlingFigure[];
}

export interface Extras {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  total: number;
}

export interface BattingScore {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalType?: string;
  bowlerId?: string;
  bowlerName?: string;
  isOnStrike?: boolean;
}

export interface BowlingFigure {
  playerId: string;
  playerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  isCurrentBowler?: boolean;
}

export interface CreateMatchRequest {
  name: string;
  format: MatchFormat;
  venue: string;
  date: string;
  team1Id: string;
  team2Id: string;
  totalOvers: number;
}

export interface TossRequest {
  tossWinnerId: string;
  tossDecision: 'bat' | 'bowl';
}

export interface StartInningRequest {
  openingBatsman1Id: string;
  openingBatsman2Id: string;
  openingBowlerId: string;
}
