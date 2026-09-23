"use client";

import { BookOpen, GraduationCap, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/user-profile";
import { cn } from "@/utils/cn";

const ROLES: { value: UserRole; label: string; hint: string; icon: LucideIcon }[] = [
  { value: "student", label: "Student", hint: "Study & prep", icon: BookOpen },
  { value: "teacher", label: "Teacher", hint: "Run classes", icon: GraduationCap },
];

interface RolePickerProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}

/** Student / teacher choice shown on sign-up. */
export function RolePicker({ value, onChange, disabled }: RolePickerProps) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">I am a…</legend>
      <div role="radiogroup" className="grid grid-cols-2 gap-3">
        {ROLES.map(({ value: role, label, hint, icon: Icon }) => {
          const active = value === role;
          return (
            <button
              key={role}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(role)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60",
                active
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
                  active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-sm font-semibold", active && "text-primary")}>
                  {label}
                </span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
