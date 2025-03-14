import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names and merges Tailwind CSS classes
 *
 * This utility handles:
 * - Combining multiple class strings
 * - Conditional classes (falsy values are filtered out)
 * - Proper merging of Tailwind CSS utility classes
 *
 * @example
 * // Basic usage
 * cn("text-red-500", "bg-blue-500")
 *
 * @example
 * // With conditionals
 * cn("text-base", isLarge && "text-lg", isActive && "font-bold")
 *
 * @param inputs - Class values to combine
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
