"use client";

import React from "react";
import Link from "next/link";
import { FlashcardSet } from "@/types/flashcard";

interface FlashcardSetCardProps {
  set: FlashcardSet;
}

export const FlashcardSetCard: React.FC<FlashcardSetCardProps> = ({ set }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold mb-2">{set.title}</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{set.description}</p>
      <p className="text-sm text-gray-500 mb-4">
        {set.cards.length} cards • Created{" "}
        {new Date(set.createdAt).toLocaleDateString()}
      </p>
      <div className="flex space-x-2">
        <Link
          href={`/flashcards/${set.id}`}
          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Study
        </Link>
        <Link
          href={`/flashcards/${set.id}/edit`}
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Edit
        </Link>
      </div>
    </div>
  );
};
