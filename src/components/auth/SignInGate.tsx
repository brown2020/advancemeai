import Auth from "@/components/Auth";
import { cn } from "@/utils/cn";

type ButtonStyle = "practice" | "quiz" | "flashcard" | "profile";

interface SignInGateProps {
  /** Title displayed in the gate */
  title: string;
  /** Description text */
  description: string;
  /** Icon to display */
  icon: React.ReactNode;
  /** Background color class for the icon container */
  iconBgColor?: string;
  /** Button style variant */
  buttonStyle?: ButtonStyle;
}

/**
 * Icon components for common use cases
 */
export const SignInGateIcons = {
  practice: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  quiz: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  flashcard: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  ),
  profile: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

/**
 * Background color mappings for icon containers
 */
const iconBgColors: Record<ButtonStyle, string> = {
  practice: "bg-muted",
  quiz: "bg-muted",
  flashcard: "bg-muted",
  profile: "bg-muted",
};

/**
 * Reusable sign-in gate component for protected pages
 */
export function SignInGate({
  title,
  description,
  icon,
  iconBgColor,
  buttonStyle = "practice",
}: SignInGateProps) {
  const bgColor = iconBgColor || iconBgColors[buttonStyle];

  return (
    <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-center rounded-xl border border-border bg-card px-4 py-12 shadow-sm sm:px-6 lg:px-8">
      <div className="flex flex-col items-center text-center mb-8">
        <div
          className={cn(
            "mb-6 rounded-full p-6 flex items-center justify-center",
            bgColor
          )}
        >
          {icon}
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground mb-6">{description}</p>
        <div className="w-full max-w-sm">
          <Auth buttonStyle={buttonStyle} />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Don&apos;t have an account? Sign up for free by clicking the button
          above.
        </p>
      </div>
    </div>
  );
}
