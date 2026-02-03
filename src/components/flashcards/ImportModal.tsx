"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

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

export function ImportModal({ onImport, trigger }: ImportModalProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [preset, setPreset] = useState<PresetKey>("auto");
  const [customOptions, setCustomOptions] = useState<ImportOptions>({
    termDefinitionDelimiter: "\t",
    cardDelimiter: "\n",
    skipEmptyRows: true,
    trimWhitespace: true,
  });
  const [preview, setPreview] = useState<{
    cards: ImportedCard[];
    errors: string[];
    warnings: string[];
  } | null>(null);

  const getOptions = useCallback((): Partial<ImportOptions> | undefined => {
    if (preset === "auto") return undefined;
    if (preset === "custom") return customOptions;
    return IMPORT_PRESETS[preset];
  }, [preset, customOptions]);

  const handleTextChange = useCallback(
    (newText: string) => {
      setText(newText);
      if (newText.trim()) {
        const result = parseFlashcardText(newText, getOptions());
        setPreview(result);
      } else {
        setPreview(null);
      }
    },
    [getOptions]
  );

  const handlePresetChange = useCallback(
    (newPreset: PresetKey) => {
      setPreset(newPreset);
      if (text.trim()) {
        const options =
          newPreset === "auto"
            ? undefined
            : newPreset === "custom"
              ? customOptions
              : IMPORT_PRESETS[newPreset];
        const result = parseFlashcardText(text, options);
        setPreview(result);
      }
    },
    [text, customOptions]
  );

  const handleImport = () => {
    if (!preview || preview.cards.length === 0) return;
    onImport(preview.cards);
    setOpen(false);
    setText("");
    setPreview(null);
  };

  const detectedOptions = text.trim() ? detectDelimiters(text) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button type="button" variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import Flashcards
          </DialogTitle>
          <DialogDescription>
            Paste your flashcards below. Each card should have a term and
            definition separated by a delimiter (tab, comma, etc.).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Format</label>
            <select
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value as PresetKey)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {Object.entries(PRESET_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom options */}
          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-md bg-muted/50">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Term/Definition separator
                </label>
                <input
                  type="text"
                  value={customOptions.termDefinitionDelimiter}
                  onChange={(e) =>
                    setCustomOptions({
                      ...customOptions,
                      termDefinitionDelimiter: e.target.value,
                    })
                  }
                  placeholder="e.g., tab, comma"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Card separator
                </label>
                <input
                  type="text"
                  value={customOptions.cardDelimiter}
                  onChange={(e) =>
                    setCustomOptions({
                      ...customOptions,
                      cardDelimiter: e.target.value,
                    })
                  }
                  placeholder="e.g., newline, semicolon"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {/* Text input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste your data
            </label>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`Example:\napple\tA red fruit\nbanana\tA yellow fruit\norange\tAn orange fruit`}
              rows={8}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Auto-detected format info */}
          {preset === "auto" && detectedOptions && text.trim() && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              Detected format: &ldquo;
              {detectedOptions.termDefinitionDelimiter === "\t"
                ? "tab"
                : detectedOptions.termDefinitionDelimiter}
              &rdquo; between term/definition,
              &ldquo;
              {detectedOptions.cardDelimiter === "\n"
                ? "newline"
                : detectedOptions.cardDelimiter}
              &rdquo; between cards
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="border border-border rounded-md overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                <span className="font-medium text-sm">Preview</span>
                <span className="text-sm text-muted-foreground">
                  {preview.cards.length} card{preview.cards.length !== 1 && "s"}{" "}
                  found
                </span>
              </div>

              {/* Errors */}
              {preview.errors.length > 0 && (
                <div className="p-3 bg-destructive/10 border-b border-border">
                  {preview.errors.map((error, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-destructive"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  ))}
                </div>
              )}

              {/* Warnings */}
              {preview.warnings.length > 0 && (
                <div className="p-3 bg-yellow-500/10 border-b border-border">
                  {preview.warnings.slice(0, 3).map((warning, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-yellow-600 dark:text-yellow-500"
                    >
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {warning}
                    </div>
                  ))}
                  {preview.warnings.length > 3 && (
                    <div className="text-sm text-yellow-600 dark:text-yellow-500 mt-1">
                      ...and {preview.warnings.length - 3} more warnings
                    </div>
                  )}
                </div>
              )}

              {/* Cards preview */}
              {preview.cards.length > 0 && (
                <div className="divide-y divide-border max-h-48 overflow-y-auto">
                  {preview.cards.slice(0, 5).map((card, i) => (
                    <div key={i} className="p-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Term
                        </div>
                        <div className="text-sm">{card.term}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Definition
                        </div>
                        <div className="text-sm">{card.definition}</div>
                      </div>
                    </div>
                  ))}
                  {preview.cards.length > 5 && (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      ...and {preview.cards.length - 5} more cards
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!preview || preview.cards.length === 0}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Import {preview?.cards.length || 0} Cards
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
