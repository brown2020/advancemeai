import Link from "next/link";
import { BookOpen, ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/UIComponents";
import { buttonVariants } from "@/components/ui/button-variants";

/** Flashcard sets shared with the group. */
export function GroupSharedSets({
  setIds,
  canManage,
  noun,
}: {
  setIds: string[];
  canManage: boolean;
  noun: string;
}) {
  const shareLink = canManage ? (
    <Link href="/flashcards" className={buttonVariants({ variant: "outline", size: "sm" })}>
      <Plus aria-hidden />
      Share a set
    </Link>
  ) : undefined;

  if (setIds.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen />}
        title="No sets shared yet"
        message={
          canManage
            ? `Share flashcard sets with the ${noun} from your library.`
            : `Sets shared with the ${noun} will appear here.`
        }
        action={shareLink}
      />
    );
  }

  return (
    <div>
      {shareLink && <div className="mb-3 flex justify-end">{shareLink}</div>}
      <ul className="grid gap-3 sm:grid-cols-2">
        {setIds.map((setId, i) => (
          <li key={setId}>
            <Link
              href={`/flashcards/${setId}`}
              className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card interactive className="flex items-center gap-3 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <BookOpen className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold">
                  Flashcard set {i + 1}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
