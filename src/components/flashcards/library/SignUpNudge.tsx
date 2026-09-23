import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ROUTES } from "@/constants/appConstants";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";

/** Sign-up prompt shown to signed-out visitors browsing the library. */
export function SignUpNudge({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-3xl border border-primary/20 bg-accent p-5 sm:flex-row sm:items-center sm:p-6",
        className
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-card">
        <Sparkles className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-semibold text-accent-foreground">
          Make these sets your own
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Sign up free to create sets, organize them into folders, star tricky
          terms and track what you&apos;ve mastered.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link href={ROUTES.AUTH.REGISTER} className={buttonVariants()}>
          Sign up free
        </Link>
        <Link
          href={ROUTES.AUTH.LOGIN}
          className={buttonVariants({ variant: "ghost" })}
        >
          Log in
        </Link>
      </div>
    </section>
  );
}
