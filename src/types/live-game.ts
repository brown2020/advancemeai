/**
 * Live Game type definitions
 * Supports real-time multiplayer study games like Match Race and Gravity
 */

import type { UserId } from "./common";

type GameCode = string;

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
