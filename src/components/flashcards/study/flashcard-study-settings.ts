export interface FlashcardStudySettings {
  /** Show definition first instead of term */
  showDefinitionFirst: boolean;
  /** Shuffle the card order */
  shuffle: boolean;
  /** Auto-advance to next card */
  autoplay: boolean;
  /** Autoplay speed in seconds */
  autoplaySpeed: number;
  /** Only show starred cards */
  starredOnly: boolean;
}

export const DEFAULT_SETTINGS: FlashcardStudySettings = {
  showDefinitionFirst: false,
  shuffle: false,
  autoplay: false,
  autoplaySpeed: 3,
  starredOnly: false,
};
