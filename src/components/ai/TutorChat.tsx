"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  X,
  AlertTriangle,
  ThumbsDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface TutorChatProps {
  /** Context about what the user is studying */
  context: {
    setTitle?: string;
    setDescription?: string;
    currentTerm?: string;
    currentDefinition?: string;
    subject?: string;
  };
  /** Whether the chat is open */
  isOpen: boolean;
  /** Callback to close the chat */
  onClose: () => void;
}

export function TutorChat({ context, isOpen, onClose }: TutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm your AI study assistant. ${
          context.setTitle
            ? `I see you're studying "${context.setTitle}". `
            : ""
        }Ask me anything about what you're learning, and I'll help you understand it better!`,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, context.setTitle]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          context: {
            setTitle: context.setTitle,
            setDescription: context.setDescription,
            currentTerm: context.currentTerm,
            currentDefinition: context.currentDefinition,
            subject: context.subject,
          },
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError("Sorry, I couldn't process your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReport = (_messageId: string) => {
    // In a full implementation, this would report the message
    alert(
      "Thank you for your feedback. This response has been flagged for review."
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md">
      <div className="rounded-xl border bg-card shadow-xl overflow-hidden flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Tutor</h3>
              <p className="text-xs text-muted-foreground">Ask me anything</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-4 py-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === "assistant" && message.id !== "welcome" && (
                  <button
                    onClick={() => handleReport(message.id)}
                    className="mt-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Report issue
                  </button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            AI responses may not always be accurate. Verify important
            information with your teacher or textbook.
          </p>
        </div>

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Floating button to open the tutor chat
 */
export function TutorChatButton({
  onClick,
  hasContext = false,
}: {
  onClick: () => void;
  hasContext?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-4 right-4 z-40 p-4 rounded-full shadow-lg transition-all hover:scale-105",
        hasContext ? "bg-primary text-primary-foreground" : "bg-card border"
      )}
      title="Ask AI Tutor"
    >
      <MessageSquare className="h-6 w-6" />
    </button>
  );
}
