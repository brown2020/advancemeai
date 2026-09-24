/**
 * Class type definitions
 * Classes are teacher-led study groups with enhanced features
 * This extends the StudyGroup type for backward compatibility
 */

import type {
  StudyGroup,
  CreateStudyGroupInput,
} from "./study-group";

/**
 * Class is an alias for StudyGroup with isClass=true
 * This provides semantic clarity while maintaining backward compatibility
 */
export interface Class extends StudyGroup {
  /** Always true for classes */
  isClass: true;
  /** School or institution name */
  school?: string;
  /** Subject or topic */
  subject?: string;
  /** Folder IDs shared with the class */
  folderIds?: string[];
}

/**
 * Input for creating a new class
 */
export interface CreateClassInput {
  name: string;
  description: string;
  isPublic: boolean;
  school?: string;
  subject?: string;
}

/**
 * Convert CreateClassInput to CreateStudyGroupInput
 */
export function toStudyGroupInput(
  input: CreateClassInput
): CreateStudyGroupInput {
  return {
    name: input.name,
    description: input.description,
    isPublic: input.isPublic,
    isClass: true,
    school: input.school,
    subject: input.subject,
  };
}

/**
 * Check if a StudyGroup is a Class
 */
export function isClass(group: StudyGroup): group is Class {
  return group.isClass === true;
}

// Re-export useful functions from study-group
export {
  
  canManageGroup,
  
  
} from "./study-group";
