import Link from "next/link";
import { CheckCircle2, Folder, Layers, Star, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeading } from "@/components/common/UIComponents";
import { ROUTES } from "@/constants/appConstants";
import type { ProfileStats } from "./useProfileStats";

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        {label}
      </div>
      <div className="mt-3 text-2xl font-bold tabular-nums">
        {value === null ? <Skeleton className="h-8 w-12" /> : value}
      </div>
    </div>
  );
}

/** Library counts: sets, folders, mastered and starred terms. */
export function ProfileStatsGrid({ stats }: { stats: ProfileStats }) {
  return (
    <section>
      <SectionHeading
        title="Your library"
        action={
          <Link
            href={ROUTES.FLASHCARDS.INDEX}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            Open library
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Sets" value={stats.setCount} icon={Layers} />
        <StatTile label="Folders" value={stats.folderCount} icon={Folder} />
        <StatTile label="Mastered" value={stats.masteredTermsCount} icon={CheckCircle2} />
        <StatTile label="Starred" value={stats.starredTermsCount} icon={Star} />
      </div>
    </section>
  );
}
