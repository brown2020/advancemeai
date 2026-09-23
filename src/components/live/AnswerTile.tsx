import { Check, Circle, Diamond, Square, Triangle, X } from "lucide-react";
import { cn } from "@/utils/cn";

/**
 * Four distinct answer tiles built from theme tokens only. Each also has a
 * shape so the choice never depends on color alone.
 */
const TILE_STYLES = [
  { tile: "bg-primary text-primary-foreground", Shape: Triangle, name: "triangle" },
  { tile: "bg-success text-success-foreground", Shape: Diamond, name: "diamond" },
  { tile: "bg-warning text-warning-foreground", Shape: Circle, name: "circle" },
  { tile: "bg-destructive text-destructive-foreground", Shape: Square, name: "square" },
] as const;

type AnswerTileProps = {
  index: number;
  label: string;
  state: "idle" | "correct" | "wrong" | "dimmed";
  disabled: boolean;
  onClick: () => void;
};

export function AnswerTile({ index, label, state, disabled, onClick }: AnswerTileProps) {
  const style = TILE_STYLES[index % TILE_STYLES.length] ?? TILE_STYLES[0];
  const { Shape } = style;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${style.name}: ${label}${state === "correct" ? " (correct)" : state === "wrong" ? " (your answer, wrong)" : ""}`}
      className={cn(
        "relative flex min-h-24 w-full items-center gap-4 rounded-2xl px-5 py-4 text-left text-base font-semibold shadow-card transition-[transform,opacity,box-shadow] sm:min-h-32 sm:text-lg",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        style.tile,
        state === "idle" && "hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]",
        state === "correct" && "ring-4 ring-foreground/80 ring-offset-2 ring-offset-background",
        state === "wrong" && "animate-shake opacity-80",
        state === "dimmed" && "opacity-35"
      )}
    >
      <Shape className="size-7 shrink-0 fill-current opacity-90" aria-hidden />
      <span className="min-w-0 flex-1 break-words">{label}</span>
      {state === "correct" && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-success" aria-hidden>
          <Check className="size-5" />
        </span>
      )}
      {state === "wrong" && (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background text-destructive" aria-hidden>
          <X className="size-5" />
        </span>
      )}
    </button>
  );
}
