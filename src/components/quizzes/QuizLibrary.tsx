import Link from "next/link";
import { ClipboardCheck, Globe, Plus, UserRound } from "lucide-react";
import {
  CardGrid,
  EmptyState,
  SectionHeading,
} from "@/components/common/UIComponents";
import { buttonVariants } from "@/components/ui/button-variants";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants/appConstants";
import { QuizCard, type QuizSummary } from "./QuizCard";

/** "New quiz" call to action shared by the list page header and empty states. */
export function NewQuizLink({ className }: { className?: string }) {
  return (
    <Link href={ROUTES.QUIZZES.CREATE} className={buttonVariants({ className })}>
      <Plus aria-hidden />
      New quiz
    </Link>
  );
}

/** Splits quizzes into the viewer's own and public ones from other people. */
export function QuizLibrary({ quizzes }: { quizzes: QuizSummary[] }) {
  if (quizzes.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardCheck />}
        title="No quizzes yet"
        message="Write a few multiple-choice questions and turn them into a quiz you can take any time."
        action={<NewQuizLink />}
      />
    );
  }

  const mine = quizzes.filter((q) => q.isOwner);
  const community = quizzes.filter((q) => !q.isOwner);

  return (
    <div className="space-y-10">
      <section aria-labelledby="your-quizzes">
        <SectionHeading
          title={<span id="your-quizzes">Your quizzes</span>}
          icon={<UserRound />}
        />
        {mine.length === 0 ? (
          <EmptyState
            className="py-10"
            title="You haven't made a quiz yet"
            message="Quizzes you create show up here."
            action={<NewQuizLink />}
          />
        ) : (
          <CardGrid>
            {mine.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </CardGrid>
        )}
      </section>

      {community.length > 0 && (
        <section aria-labelledby="public-quizzes">
          <SectionHeading
            title={<span id="public-quizzes">Public quizzes</span>}
            icon={<Globe />}
          />
          <CardGrid>
            {community.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} />
            ))}
          </CardGrid>
        </section>
      )}
    </div>
  );
}

/** Placeholder grid while quizzes load. */
export function QuizLibrarySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading quizzes">
      <Skeleton className="mb-4 h-6 w-40 rounded-lg" />
      <CardGrid>
        {["q1", "q2", "q3"].map((id) => (
          <Skeleton key={id} className="h-40 rounded-2xl" />
        ))}
      </CardGrid>
    </div>
  );
}
