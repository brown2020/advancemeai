import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ROUTES } from "@/constants/appConstants";
import type { TestSection } from "@/services/practiceTestService";
import { getSectionMeta } from "./sectionMeta";

/** Hub card linking to adaptive practice for one SAT section. */
export function SectionCard({ section }: { section: TestSection }) {
  const meta = getSectionMeta(section.id);
  const Icon = meta.icon;

  return (
    <Link
      href={ROUTES.PRACTICE.SECTION(section.id)}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card interactive className="flex h-full flex-col p-5">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
          <Icon className="size-5" aria-hidden />
        </div>
        <h3 className="text-base font-semibold">{section.title}</h3>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">
          {section.description || meta.blurb}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          Practice
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </Card>
    </Link>
  );
}
