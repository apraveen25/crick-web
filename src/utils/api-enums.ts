// Bidirectional maps for integer enums used by the API.
// API sends and receives integers; frontend works with readable strings.

export const BattingStyleToInt: Record<string, number> = { RightHanded: 0, LeftHanded: 1 };
export const BattingStyleFromInt: Record<number, string> = { 0: 'RightHanded', 1: 'LeftHanded' };

export const BowlingStyleToInt: Record<string, number> = {
  None: 0, RightArmFast: 1, RightArmMediumFast: 2, RightArmMedium: 3,
  RightArmOffSpin: 4, RightArmLegSpin: 5, LeftArmFast: 6, LeftArmMediumFast: 7,
  LeftArmMedium: 8, LeftArmOrthodox: 9, LeftArmUnorthodox: 10,
};
export const BowlingStyleFromInt: Record<number, string> = {
  0: 'None', 1: 'RightArmFast', 2: 'RightArmMediumFast', 3: 'RightArmMedium',
  4: 'RightArmOffSpin', 5: 'RightArmLegSpin', 6: 'LeftArmFast', 7: 'LeftArmMediumFast',
  8: 'LeftArmMedium', 9: 'LeftArmOrthodox', 10: 'LeftArmUnorthodox',
};

export const PlayerRoleToInt: Record<string, number> = { Batsman: 0, Bowler: 1, AllRounder: 2, WicketKeeper: 3 };
export const PlayerRoleFromInt: Record<number, string> = { 0: 'Batsman', 1: 'Bowler', 2: 'AllRounder', 3: 'WicketKeeper' };

export const ExtraTypeToInt: Record<string, number> = { None: 0, Wide: 1, NoBall: 2, Bye: 3, LegBye: 4 };
export const ExtraTypeFromInt: Record<number, string> = { 0: 'None', 1: 'Wide', 2: 'NoBall', 3: 'Bye', 4: 'LegBye' };

export const WicketTypeToInt: Record<string, number> = {
  Bowled: 0, Caught: 1, RunOut: 2, Stumped: 3, LBW: 4,
  HitWicket: 5, ObstructingField: 6, TimedOut: 7, DoubleHit: 8,
};

export const MatchFormatToInt: Record<string, number> = { T20: 0, ODI: 1, Test: 2, Custom: 3 };
export const MatchFormatFromInt: Record<number, string> = { 0: 'T20', 1: 'ODI', 2: 'Test', 3: 'Custom' };

export const TossDecisionToInt: Record<string, number> = { Bat: 0, Bowl: 1 };
