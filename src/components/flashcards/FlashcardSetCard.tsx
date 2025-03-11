"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { FlashcardSet } from "@/models/flashcard";
import Link from "next/link";
import { formatDate } from "@/utils/formatters";

interface FlashcardSetCardProps {
  set: FlashcardSet;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export function FlashcardSetCard({
  set,
  onDelete,
  isDeleting,
}: FlashcardSetCardProps) {
  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle>{set.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {set.description || "No description provided."}
        </p>
        <p className="text-sm text-gray-500">
          {set.cards.length} cards • Created {formatDate(set.createdAt)}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Link href={`/flashcards/${set.id}`} passHref>
            <Button variant="primary" size="sm">
              Study
            </Button>
          </Link>
          <Link href={`/flashcards/${set.id}/edit`} passHref>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
        </div>
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            onClick={onDelete}
            isLoading={isDeleting}
          >
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
