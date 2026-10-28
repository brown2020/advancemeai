import { safeFlashcardImageUrl } from "@/lib/safe-image-url";

/** Renders a flashcard image only when the URL is a Firebase Storage download URL. */
export function FlashcardImage({
  src,
  className,
}: {
  src?: string;
  className?: string;
}) {
  const safe = safeFlashcardImageUrl(src);
  if (!safe) return null;
  return <img src={safe} alt="" className={className} />;
}
