import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  House,
  LineChart,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/constants/appConstants";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Extra path prefixes that should mark this item active. */
  match?: string[];
};

export const PRIMARY_NAV: NavItem[] = [
  { href: ROUTES.HOME, label: "Home", icon: House },
  { href: ROUTES.FLASHCARDS.INDEX, label: "Flashcards", icon: BookOpen, match: ["/study-guides"] },
  { href: ROUTES.PRACTICE.INDEX, label: "SAT Prep", icon: GraduationCap, match: ["/test"] },
  { href: ROUTES.QUIZZES.INDEX, label: "Quizzes", icon: ClipboardList },
  { href: "/groups", label: "Classes", icon: Users, match: ["/live"] },
];

export const PUBLIC_NAV: NavItem[] = [
  { href: ROUTES.FLASHCARDS.INDEX, label: "Flashcards", icon: BookOpen },
  { href: ROUTES.PRACTICE.INDEX, label: "SAT Prep", icon: GraduationCap },
];

export type CreateItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const CREATE_ITEMS: CreateItem[] = [
  {
    href: ROUTES.FLASHCARDS.CREATE,
    label: "Flashcard set",
    description: "Type or import terms",
    icon: BookOpen,
  },
  {
    href: "/study-guides/create",
    label: "AI study guide",
    description: "Turn notes into cards",
    icon: Sparkles,
  },
  {
    href: ROUTES.QUIZZES.CREATE,
    label: "Quiz",
    description: "Multiple-choice questions",
    icon: ClipboardList,
  },
  {
    href: "/groups/create",
    label: "Class",
    description: "Share sets with students",
    icon: Users,
  },
];

export const ACCOUNT_LINKS: NavItem[] = [
  { href: "/progress", label: "Progress", icon: LineChart },
];

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  const prefixes = [item.href, ...(item.match ?? [])];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
