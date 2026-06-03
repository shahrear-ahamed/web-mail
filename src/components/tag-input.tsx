"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder = "Add email…", className }: TagInputProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "").trim();
    if (!trimmed) return;
    if (!isValidEmail(trimmed)) { setError(true); return; }
    if (!value.includes(trimmed)) onChange([...value, trimmed]);
    setInput("");
    setError(false);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      commit(input);
    } else if (e.key === "Backspace" && !input) {
      onChange(value.slice(0, -1));
    } else {
      setError(false);
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 min-h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm cursor-text",
        error && "border-destructive ring-3 ring-destructive/20",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(value.filter((t) => t !== tag)); }}
            className="hover:text-destructive transition-colors"
            aria-label={`Remove ${tag}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => { setInput(e.target.value); setError(false); }}
        onKeyDown={handleKey}
        onBlur={() => { if (input) commit(input); }}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-24 bg-transparent outline-none placeholder:text-muted-foreground"
        type="text"
        inputMode="email"
        autoComplete="off"
      />
    </div>
  );
}
