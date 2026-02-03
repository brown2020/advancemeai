/**
 * Live Game type definitions
 * Supports real-time multiplayer study games like Match Race and Gravity
 */

import type { Timestamp, UserId } from "./common";
import type { FlashcardId } from "./flashcard";

export type GameId = string;
export type GameCode = string;

/**
 * Types of live games available
 */
export type GameType = "match" | "gravity" | "blast";

/**
 * Game status
 */
export type GameStatus = "waiting" | "countdown" | "playing" | "finished";

/**
 * Player in a live game
 */
export interface GamePlayer {
  id: UserId;
  displayName: string;
  avatarUrl?: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  /** Time taken in milliseconds */
  timeTaken: number;
  /** Rank at end of game */
  rank?: number;
  /** Whether the player is still connected */
  isConnected: boolean;
  /** Whether the player has finished */
  isFinished: boolean;
}

/**
 * A question/challenge in a live game
 */
export interface GameQuestion {
  id: string;
  cardId: FlashcardId;
  term: string;
  definition: string;
  /** For multiple choice */
  options?: string[];
  /** Index of correct option */
  correctIndex?: number;
}

/**
 * Match game pair (term to definition matching)
 */
export interface MatchPair {
  id: string;
  cardId: FlashcardId;
  term: string;
  definition: string;
  isMatched: boolean;
  matchedBy?: UserId;
}

/**
 * Live game session
 */
export interface LiveGame {
  id: GameId;
  code: GameCode;
  type: GameType;
  status: GameStatus;
  /** The flashcard set being used */
  setId: FlashcardId;
  setTitle: string;
  /** Host/creator of the game */
  hostId: UserId;
  /** All players including host */
  players: GamePlayer[];
  /** Questions/challenges for the game */
  questions: GameQuestion[];
  /** For match games, the pairs to match */
  matchPairs?: MatchPair[];
  /** Game settings */
  settings: GameSettings;
  /** When the game was created */
  createdAt: Timestamp;
  /** When the game started */
  startedAt?: Timestamp;
  /** When the game ended */
  endedAt?: Timestamp;
  /** Countdown value (seconds remaining) */
  countdown?: number;
  /** Current question index for sequential games */
  currentQuestionIndex?: number;
}

/**
 * Game settings
 */
export interface GameSettings {
  /** Max number of players */
  maxPlayers: number;
  /** Number of questions/rounds */
  questionCount: number;
  /** Time limit per question in seconds (0 = no limit) */
  timeLimitPerQuestion: number;
  /** Whether to shuffle questions */
  shuffleQuestions: boolean;
  /** Whether to show term or definition first */
  showTermFirst: boolean;
  /** For Match: number of pairs */
  matchPairCount?: number;
  /** For Gravity: starting speed */
  gravitySpeed?: number;
}

/**
 * Player's answer to a question
 */
export interface PlayerAnswer {
  playerId: UserId;
  questionId: string;
  answer: string | number; // text answer or option index
  isCorrect: boolean;
  timeTaken: number; // milliseconds
  timestamp: Timestamp;
}

/**
 * Game result summary
 */
export interface GameResult {
  gameId: GameId;
  type: GameType;
  players: GamePlayer[];
  winner?: GamePlayer;
  /** Total game duration in milliseconds */
  duration: number;
  /** Average score */
  averageScore: number;
  /** Total questions answered */
  totalAnswers: number;
  /** Total correct answers */
  totalCorrect: number;
}

/**
 * Generate a random game code
 */
export function generateGameCode(): GameCode {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Default game settings by game type
 */
export function getDefaultGameSettings(type: GameType): GameSettings {
  switch (type) {
    case "match":
      return {
        maxPlayers: 8,
        questionCount: 12,
        timeLimitPerQuestion: 0,
        shuffleQuestions: true,
        showTermFirst: true,
        matchPairCount: 6,
      };
    case "gravity":
      return {
        maxPlayers: 1, // Single player
        questionCount: 20,
        timeLimitPerQuestion: 0,
        shuffleQuestions: true,
        showTermFirst: true,
        gravitySpeed: 1,
      };
    case "blast":
      return {
        maxPlayers: 10,
        questionCount: 15,
        timeLimitPerQuestion: 10,
        shuffleQuestions: true,
        showTermFirst: true,
      };
    default:
      return {
        maxPlayers: 8,
        questionCount: 10,
        timeLimitPerQuestion: 15,
        shuffleQuestions: true,
        showTermFirst: true,
      };
  }
}

/**
 * Calculate points for a correct answer
 */
export function calculatePoints(
  timeTaken: number,
  timeLimit: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;
  if (timeLimit === 0) return 100; // No time limit, flat points

  // Bonus for speed (max 1000 points)
  const timeRatio = Math.max(0, 1 - timeTaken / (timeLimit * 1000));
  const speedBonus = Math.floor(timeRatio * 500);
  return 500 + speedBonus; // Base 500 + up to 500 speed bonus
}

/**
 * Get game type display name
 */
export function getGameTypeName(type: GameType): string {
  switch (type) {
    case "match":
      return "Match";
    case "gravity":
      return "Gravity";
    case "blast":
      return "Blast";
    default:
      return type;
  }
}

/**
 * Get game type description
 */
export function getGameTypeDescription(type: GameType): string {
  switch (type) {
    case "match":
      return "Race to match all terms with definitions";
    case "gravity":
      return "Type definitions before asteroids hit the planet";
    case "blast":
      return "Answer questions quickly to earn points";
    default:
      return "";
  }
}
