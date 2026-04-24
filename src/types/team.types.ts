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
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
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
}

// POST /players — create a standalone global player (API field: playerRole)
export interface CreatePlayerRequest {
  name: string;
  dateOfBirth: string;
  nationality: string;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  playerRole: PlayerRole;
  jerseyNumber?: number;
}

// PUT /players/{id} — update player (API field: role, not playerRole)
export interface UpdatePlayerRequest {
  name: string;
  dateOfBirth: string;
  nationality: string;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  role: PlayerRole;
  jerseyNumber?: number;
}

// POST /teams/{id}/players — add player to team (API field: role + captain/keeper flags)
export interface AddPlayerRequest {
  name: string;
  dateOfBirth: string;
  nationality: string;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  role: PlayerRole;
  isCaptain: boolean;
  isWicketKeeper: boolean;
  jerseyNumber?: number;
}

// POST /teams/{id}/players — add existing player by ID
export interface AddExistingPlayerRequest {
  playerId: string;
  name: string;
  role: PlayerRole;
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
}

// PUT /teams/{id}/players/{playerId} — update team player
export interface UpdateTeamPlayerRequest {
  name?: string;
  role: PlayerRole;
  isCaptain?: boolean;
  isWicketKeeper?: boolean;
}
