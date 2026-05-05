export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FINISHED';

export interface Match {
  id: string;
  title: string;
  match_type: string;
  status: MatchStatus;
  venue: string;
  date: string;
  team_home: string;
  team_away: string;
  toss: string;
  lastUpdated: string;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  role: 'batsman' | 'bowler' | 'allrounder' | 'wicketkeeper';
  recent_form: number;
  credits: number;
  selection_percentage: number;
}

export interface FantasyTeam {
  id: string;
  matchId: string;
  type: 'Safe' | 'GL' | 'Extreme GL' | 'Experimental';
  playerIds: string[];
  captainId: string;
  viceCaptainId: string;
  winProbability: number;
  createdAt: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}
