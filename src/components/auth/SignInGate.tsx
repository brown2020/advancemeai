import { BookOpen, ClipboardCheck, GraduationCap, UserRound } from "lucide-react";
import { AuthLinks } from "@/components/auth/AuthLinks";

interface SignInGateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const SignInGateIcons = {
  practice: <GraduationCap aria-hidden />,
  quiz: <ClipboardCheck aria-hidden />,
  flashcard: <BookOpen aria-hidden />,
  profile: <UserRound aria-hidden />,
};

/** Friendly wall for signed-out visitors on pages that need an account. */
export function SignInGate({ title, description, icon }: SignInGateProps) {
  return (
    <div className="mx-auto mt-4 flex max-w-xl flex-col items-center rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-card sm:px-10">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-accent text-primary [&_svg]:size-8">
        {icon}
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <AuthLinks className="mt-8 w-full max-w-sm" />
      <p className="mt-4 text-xs text-muted-foreground">Free forever. No credit card.</p>
    </div>
  );
}
