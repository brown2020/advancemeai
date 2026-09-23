import Link from "next/link";
import { ArrowRight, ClipboardList, Clock, Layers, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/appConstants";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";

const totalMinutes = DIGITAL_SAT_SECTIONS.reduce(
  (sum, section) => sum + section.timeLimitMinutes,
  0
);

const FEATURES = [
  { icon: Clock, label: `Timed · ${totalMinutes} min total` },
  { icon: Layers, label: `${DIGITAL_SAT_SECTIONS.length} sections, like test day` },
  { icon: Sparkles, label: "Personal AI study plan" },
];

/** Primary hub CTA for the full-length Digital SAT. */
export function FullTestCard() {
  return (
    <section className="relative mb-10 overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-card sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <ClipboardList className="size-6" aria-hidden />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Recommended
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Full-length Digital SAT
            </h2>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-base">
              Take a complete, timed practice test across Reading &amp; Writing
              and Math, then get a personalized study plan.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Icon className="size-4 text-primary" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Link
          href={ROUTES.PRACTICE.FULL_TEST}
          className={buttonVariants({ size: "lg", className: "w-full lg:w-auto" })}
        >
          Start full test
          <ArrowRight aria-hidden />
        </Link>
      </div>
    </section>
  );
}
