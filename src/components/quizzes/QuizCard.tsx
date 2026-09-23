import Link from "next/link";
import { ClipboardCheck, Globe, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/constants/appConstants";

export type QuizSummary = {
  id: string;
  title: string;
  questionCount: number;
  isOwner: boolean;
  isPublic: boolean;
  createdAt?: number;
};

/** Library tile for a quiz; the whole card links to the take screen. */
export function QuizCard({ quiz }: { quiz: QuizSummary }) {
  const questionLabel = `${quiz.questionCount} question${quiz.questionCount === 1 ? "" : "s"}`;

  return (
    <Link
      href={ROUTES.QUIZZES.QUIZ(quiz.id)}
      className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card interactive className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <ClipboardCheck className="size-5" aria-hidden />
          </div>
          {quiz.isOwner ? (
            <Badge variant={quiz.isPublic ? "default" : "secondary"}>
              {quiz.isPublic ? <Globe aria-hidden /> : <Lock aria-hidden />}
              {quiz.isPublic ? "Public" : "Private"}
            </Badge>
          ) : (
            <Badge variant="outline">
              <Globe aria-hidden />
              Community
            </Badge>
          )}
        </div>

        <h3 className="mt-4 line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary">
          {quiz.title || "Untitled quiz"}
        </h3>

        <p className="mt-auto pt-3 text-sm text-muted-foreground">
          {questionLabel}
          {quiz.createdAt ? (
            <>
              <span aria-hidden> · </span>
              {new Date(quiz.createdAt).toLocaleDateString()}
            </>
          ) : null}
        </p>
      </Card>
    </Link>
  );
}
