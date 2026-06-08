// src/lib/validations.ts
import { z } from 'zod';

export const PlayerRegistrationSchema = z.object({
  // Step 1
  fullName: z.string().min(2, 'Full name required'),
  nickname: z.string().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Valid 10-digit mobile required'),
  whatsapp: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal('')),
  // Step 2
  primaryRole: z.enum(['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER']),
  battingStyle: z.enum(['RIGHT_HAND', 'LEFT_HAND']),
  bowlingStyle: z.enum([
    'RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_OFF_SPIN', 'RIGHT_ARM_LEG_SPIN',
    'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_ORTHODOX', 'LEFT_ARM_WRIST_SPIN',
    'RIGHT_HAND_HALF', 'LEFT_HAND_HALF', 'DOES_NOT_BOWL',
  ]),
  // Step 3
  matchesPlayed: z.coerce.number().min(0).default(0),
  runs: z.coerce.number().min(0).default(0),
  highestScore: z.coerce.number().min(0).default(0),
  battingAverage: z.coerce.number().min(0).default(0),
  strikeRate: z.coerce.number().min(0).default(0),
  wickets: z.coerce.number().min(0).default(0),
  bestBowlingFigures: z.string().optional(),
  economyRate: z.coerce.number().min(0).default(0),
  catches: z.coerce.number().min(0).default(0),
  runOuts: z.coerce.number().min(0).default(0),
  momAwards: z.coerce.number().min(0).default(0),
  // Step 4
  preferredBattingPosition: z.coerce.number().min(1).max(11).optional(),
  preferredBowlingPhase: z.enum(['POWERPLAY', 'MIDDLE_OVERS', 'DEATH_OVERS']).optional(),
  strengths: z.string().max(500).optional(),
  bio: z.string().max(1000).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email().optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
  password: z.string().min(6).optional(),
  otp: z.string().length(6).optional(),
});

export const PlaceBidSchema = z.object({
  sessionId: z.string().cuid(),
  amount: z.number().int().positive(),
});

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  purse: z.coerce.number().int().min(10).max(500).default(100),
  captainUserId: z.string().cuid().optional(),
});

export const UpdatePlayerSchema = z.object({
  fullName: z.string().min(2).optional(),
  nickname: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  basePrice: z.coerce.number().int().min(1).max(100).optional(),
  adminRatingOverride: z.coerce.number().int().min(0).max(100).optional().nullable(),
  auctionOrder: z.coerce.number().int().min(1).optional(),
  primaryRole: z.enum(['BATTER', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER']).optional(),
  battingStyle: z.enum(['RIGHT_HAND', 'LEFT_HAND']).optional(),
  bowlingStyle: z.enum([
    'RIGHT_ARM_FAST', 'RIGHT_ARM_MEDIUM', 'RIGHT_ARM_OFF_SPIN', 'RIGHT_ARM_LEG_SPIN',
    'LEFT_ARM_FAST', 'LEFT_ARM_MEDIUM', 'LEFT_ARM_ORTHODOX', 'LEFT_ARM_WRIST_SPIN',
    'RIGHT_HAND_HALF', 'LEFT_HAND_HALF', 'DOES_NOT_BOWL',
  ]).optional(),
  matchesPlayed: z.coerce.number().min(0).optional(),
  runs: z.coerce.number().min(0).optional(),
  highestScore: z.coerce.number().min(0).optional(),
  battingAverage: z.coerce.number().min(0).optional(),
  strikeRate: z.coerce.number().min(0).optional(),
  wickets: z.coerce.number().min(0).optional(),
  economyRate: z.coerce.number().min(0).optional(),
  catches: z.coerce.number().min(0).optional(),
  runOuts: z.coerce.number().min(0).optional(),
  momAwards: z.coerce.number().min(0).optional(),
  strengths: z.string().max(500).optional(),
  bio: z.string().max(1000).optional(),
});

export const AuctionSetupSchema = z.object({
  timerSeconds: z.coerce.number().int().min(10).max(60).default(30),
  bidIncrement: z.coerce.number().int().refine(v => [1, 2, 5, 10].includes(v), {
    message: 'Bid increment must be 1, 2, 5, or 10',
  }),
  name: z.string().min(2).default('ACPL 3 Player Auction'),
});

export type PlayerRegistrationInput = z.infer<typeof PlayerRegistrationSchema>;
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export type UpdatePlayerInput = z.infer<typeof UpdatePlayerSchema>;
export type AuctionSetupInput = z.infer<typeof AuctionSetupSchema>;
