"use client";

import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  parseFlashcardText,
  detectDelimiters,
  IMPORT_PRESETS,
  type ImportedCard,
  type ImportOptions,
} from "@/utils/flashcardImport";

interface ImportModalProps {
  onImport: (cards: ImportedCard[]) => void;
  trigger?: React.ReactNode;
}

type PresetKey = keyof typeof IMPORT_PRESETS | "auto" | "custom";

const PRESET_LABELS: Record<PresetKey, string> = {
  auto: "Auto-detect",
  TAB_NEWLINE: "Tab separated (Quizlet format)",
  COMMA_NEWLINE: "Comma separated (CSV)",
  DASH_SEMICOLON: "Dash separated, semicolon rows",
  COLON_NEWLINE: "Colon separated",
  custom: "Custom",
};

const DEFAULT_CUSTOM_OPTIONS: ImportOptions = {
  termDefinitionDelimiter: "\t",
  cardDelimiter: "\n",
  skipEmptyRows: true,
  trimWhitespace: true,
};

const PREVIEW_LIMIT = 5;
const WARNING_LIMIT = 3;

function describeDelimiter(value: string): string {
  if (value === "\t") return "tab";
  if (value === "\n") return "new line";
  return value;
}

export function ImportModal({ onImport, trigger }: ImportModalProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [preset, setPreset] = useState<PresetKey>("auto");
  const [customOptions, setCustomOptions] = useState<ImportOptions>(DEFAULT_CUSTOM_OPTIONS);

  const hasText = text.trim().length > 0;

  const preview = useMemo(() => {
    if (!hasText) return null;
    const options =
      preset === "auto"
        ? undefined
        : preset === "custom"
          ? customOptions
          : IMPORT_PRESETS[preset];
    return parseFlashcardText(text, options);
  }, [hasText, text, preset, customOptions]);

  const detectedOptions = preset === "auto" && hasText ? detectDelimiters(text) : null;
  const cardCount = preview?.cards.length ?? 0;

  const handleImport = () => {
    if (!preview || cardCount === 0) return;
    onImport(preview.cards);
    setOpen(false);
    setText("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline">
            <Upload aria-hidden />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-primary">
              <FileText className="size-5" aria-hidden />
            </span>
            Import cards
          </DialogTitle>
          <DialogDescription>
            Paste rows from a spreadsheet, Quizlet export, or notes. Each row
            needs a term and a definition separated by a tab, comma, or similar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Format" htmlFor="import-format" className="mb-0">
            <Select
              id="import-format"
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetKey)}
            >
              {Object.entries(PRESET_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>

          {preset === "custom" && (
            <div className="grid grid-cols-1 gap-3 rounded-xl bg-secondary/60 p-4 sm:grid-cols-2">
              <FormField label="Between term and definition" htmlFor="import-term-sep" className="mb-0">
                <Input
                  id="import-term-sep"
                  value={customOptions.termDefinitionDelimiter}
                  onChange={(e) =>
                    setCustomOptions((prev) => ({
                      ...prev,
                      termDefinitionDelimiter: e.target.value,
                    }))
                  }
                  placeholder="e.g. tab, comma"
                />
              </FormField>
              <FormField label="Between cards" htmlFor="import-card-sep" className="mb-0">
                <Input
                  id="import-card-sep"
                  value={customOptions.cardDelimiter}
                  onChange={(e) =>
                    setCustomOptions((prev) => ({
                      ...prev,
                      cardDelimiter: e.target.value,
                    }))
                  }
                  placeholder="e.g. new line, semicolon"
                />
              </FormField>
            </div>
          )}

          <FormField label="Paste your data" htmlFor="import-paste-data" className="mb-0">
            <Textarea
              id="import-paste-data"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Example:\napple\tA red fruit\nbanana\tA yellow fruit\norange\tAn orange fruit`}
              rows={8}
              className="font-mono text-xs sm:text-sm"
            />
          </FormField>

          {detectedOptions && (
            <p className="rounded-xl bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Detected{" "}
              <span className="font-semibold text-foreground">
                {describeDelimiter(detectedOptions.termDefinitionDelimiter)}
              </span>{" "}
              between term and definition,{" "}
              <span className="font-semibold text-foreground">
                {describeDelimiter(detectedOptions.cardDelimiter)}
              </span>{" "}
              between cards.
            </p>
          )}

          {preview && (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-4 py-2">
                <span className="text-sm font-semibold">Preview</span>
                <span className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
                  {cardCount} card{cardCount !== 1 && "s"} found
                </span>
              </div>

              {preview.errors.length > 0 && (
                <ul className="space-y-1 border-b border-border bg-destructive/10 p-3">
                  {preview.errors.map((error) => (
                    <li key={error} className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {error}
                    </li>
                  ))}
                </ul>
              )}

              {preview.warnings.length > 0 && (
                <ul className="space-y-1 border-b border-border bg-warning/10 p-3 text-sm text-warning">
                  {preview.warnings.slice(0, WARNING_LIMIT).map((warning) => (
                    <li key={warning} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      {warning}
                    </li>
                  ))}
                  {preview.warnings.length > WARNING_LIMIT && (
                    <li className="pl-6 text-xs">
                      …and {preview.warnings.length - WARNING_LIMIT} more warnings
                    </li>
                  )}
                </ul>
              )}

              {cardCount > 0 && (
                <ul className="max-h-56 divide-y divide-border overflow-y-auto">
                  {preview.cards.slice(0, PREVIEW_LIMIT).map((card, index) => (
                    <li
                      key={`${index}::${card.term}::${card.definition}`}
                      className="grid grid-cols-1 gap-1 p-3 sm:grid-cols-2 sm:gap-4"
                    >
                      <div className="text-sm font-medium">{card.term}</div>
                      <div className="text-sm text-muted-foreground">{card.definition}</div>
                    </li>
                  ))}
                  {cardCount > PREVIEW_LIMIT && (
                    <li className="p-3 text-center text-xs text-muted-foreground">
                      …and {cardCount - PREVIEW_LIMIT} more cards
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleImport} disabled={cardCount === 0}>
              <CheckCircle2 aria-hidden />
              Import {cardCount} {cardCount === 1 ? "card" : "cards"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
