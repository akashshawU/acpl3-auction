// Plain TypeScript types — no @prisma/client import, safe for client components

export type Role = 'SUPER_ADMIN' | 'CAPTAIN';
export type PlayerStatus = 'APPROVED' | 'SOLD' | 'UNSOLD';
export type AuctionStatus = 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'COMPLETED';
export type BidStatus = 'WINNING' | 'OUTBID' | 'ACTIVE' | 'CANCELLED';
export type AuctionType = 'DEMO' | 'LIVE';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  teamId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerPerformance {
  id: string;
  playerId: string;
  innings: number;
  runs: number;
  battingAverage: number;
  strikeRate: number;
  rankInBattingLeaderboard: number;
  wickets: number;
  economy: number;
  bowlingAverage: number;
  rankInBowlingLeaderboard: number;
  dismissal: number;
  mvpScore: number;
  rankInMVPLeaderboard: number;
  cumulativeAuctionScore: number;
  casCategory: string;
  adminScoreOverride: number | null;
  overrideReason: string | null;
  importedAt: Date | null;
  lastEditedBy: string | null;
  lastEditedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id: string;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  primaryRole: string;
  battingStyle: string;
  bowlingStyle: string;
  matchesPlayed: number;
  runs: number;
  highestScore: number;
  battingAverage: number;
  strikeRate: number;
  wickets: number;
  bestBowlingFigures: string | null;
  economyRate: number;
  catches: number;
  runOuts: number;
  momAwards: number;
  acplRating: number;
  acplCategory: string;
  basePrice: number;
  soldPrice: number | null;
  status: string;
  teamId: string | null;
  auctionOrder: number | null;
  // Profile extras
  mobileNumber: string | null;
  whatsappNumber: string | null;
  bio: string | null;
  strengths: string | null;
  preferredBattingPosition: number | null;
  preferredBowlingPhase: string | null;
  // AI scouting note
  aiRecommendation: string | null;
  performance?: PlayerPerformance | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  color: string | null;
  logoUrl: string | null;
  purse: number;
  remainingPurse: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionSession {
  id: string;
  name: string;
  type: AuctionType;
  status: string;
  isArchived: boolean;
  archivedAt: Date | null;
  currentPlayerId: string | null;
  currentBid: number | null;
  currentLeaderTeamId: string | null;
  timerSeconds: number;
  timerStartedAt: Date | null;
  bidIncrement: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionResult {
  id: string;
  sessionId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  soldPrice: number;
  auctionType: AuctionType;
  createdAt: Date;
}

export interface Bid {
  id: string;
  sessionId: string;
  playerId: string;
  teamId: string;
  amount: number;
  status: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  sessionId: string | null;
  playerId: string | null;
  userId: string | null;
  action: string;
  amount: number | null;
  details: unknown;
  createdAt: Date;
}

export interface TeamWithPlayers extends Team {
  players: Player[];
  users?: User[];
}

export interface BidWithRelations extends Bid {
  team: Team;
  player: Player;
}

export interface AuctionState {
  session: (AuctionSession & { bids: BidWithRelations[] }) | null;
  teams: TeamWithPlayers[];
  currentPlayer: Player | null;
  timerRemaining: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ImportResult {
  totalRows: number;
  matched: number;
  unmatched: string[];
  errors: string[];
}
