export type BattingStyle = 'RightHanded' | 'LeftHanded';

export type BowlingStyle =
  | 'None'
  | 'RightArmFast'
  | 'RightArmMediumFast'
  | 'RightArmMedium'
  | 'RightArmOffSpin'
  | 'RightArmLegSpin'
  | 'LeftArmFast'
  | 'LeftArmMediumFast'
  | 'LeftArmMedium'
  | 'LeftArmOrthodox'
  | 'LeftArmUnorthodox';

export type PlayerRole = 'Batsman' | 'Bowler' | 'AllRounder' | 'WicketKeeper';

export interface Player {
  id: string;
  name: string;
  dateOfBirth: string;
  nationality: string;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  playerRole: PlayerRole;
  jerseyNumber?: number;
}

export interface TeamPlayer {
  teamId: string;
  playerId: string;
  player: Player;
  jerseyNumber?: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  players: TeamPlayer[];
  createdAt: string;
}

export interface CreateTeamRequest {
  name: string;
  shortName: string;
  logoUrl?: string;
}

export interface AddPlayerRequest {
  name: string;
  dateOfBirth: string;
  nationality: string;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  playerRole: PlayerRole;
  jerseyNumber?: number;
}
