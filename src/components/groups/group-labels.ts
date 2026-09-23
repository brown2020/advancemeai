import type { StudyGroup } from "@/types/study-group";
import { getAllMemberIds } from "@/types/study-group";

/**
 * Teacher-led groups are "classes"; everything else stays a "study group".
 * The feature itself is labelled "Classes" in navigation.
 */
export function groupNoun(group: Pick<StudyGroup, "isClass">): string {
  return group.isClass ? "class" : "study group";
}

export function memberCountLabel(group: StudyGroup): string {
  const count = getAllMemberIds(group).length;
  return `${count} member${count === 1 ? "" : "s"}`;
}
