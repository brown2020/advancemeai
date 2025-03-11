export const FLASHCARD_LIMITS = {
  MIN_CARDS: 2,
  MAX_CARDS: 500,
  MAX_TERM_LENGTH: 200,
  MAX_DEFINITION_LENGTH: 1000,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
};

export const ROUTES = {
  HOME: "/",
  FLASHCARDS: "/flashcards",
  CREATE_FLASHCARD: "/flashcards/create",
  EDIT_FLASHCARD: (id: string) => `/flashcards/${id}/edit`,
  STUDY_FLASHCARD: (id: string) => `/flashcards/${id}`,
};

export const ERROR_CODES = {
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
  VALIDATION_ERROR: "validation_error",
  SERVER_ERROR: "server_error",
};
