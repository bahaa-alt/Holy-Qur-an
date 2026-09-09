"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useSearch } from "./useSearch";
import { SuggestionList } from "./SuggestionList";
import type { Suggestion } from "@/lib/search/suggest";

const PLACEHOLDERS = ["كتب", "رحم", "knowledge", "يعلمون", "قول", "mercy"];

export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);

  const { suggestions } = useSearch(query);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i = (i + 1) % PLACEHOLDERS.length;
      setPlaceholder(PLACEHOLDERS[i]);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    setOpen(value.trim() !== "");
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(s: Suggestion) {
    setOpen(false);
    setQuery("");
    router.push(s.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        select(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm focus-within:border-accent">
        <Search size={18} className="shrink-0 text-muted" />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => query.trim() !== "" && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={`Search a root, word, or translation… e.g. ${placeholder}`}
          aria-label="Search a root, word, or translation"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
        />
        {!query && (
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted sm:inline">
            /
          </kbd>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
        >
          <SuggestionList suggestions={suggestions} activeIndex={activeIndex} onSelect={select} />
        </div>
      )}
    </div>
  );
}
