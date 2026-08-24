"use client";

import { Command, Search, X } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";

export type QuickStudyCommand = {
  id: string;
  label: string;
  description: string;
  group: "Selected verse" | "Find resources" | "Prepare and present";
  keywords: string[];
  icon: ReactNode;
  action: () => void;
};

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export default function QuickStudyPalette({
  open,
  selectedRef,
  commands,
  onOpenChange,
}: {
  open: boolean;
  selectedRef: string;
  commands: QuickStudyCommand[];
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const filteredCommands = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query);
    if (!normalizedQuery) return commands;
    return commands.filter((command) =>
      normalizeSearchText([command.label, command.description, command.group, ...command.keywords].join(" "))
        .includes(normalizedQuery),
    );
  }, [commands, query]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          setQuery("");
          setActiveIndex(0);
          onOpenChange(false);
        } else {
          setQuery("");
          setActiveIndex(0);
          onOpenChange(true);
        }
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        setQuery("");
        setActiveIndex(0);
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  if (!open) return null;

  function runCommand(command: QuickStudyCommand) {
    setQuery("");
    setActiveIndex(0);
    onOpenChange(false);
    command.action();
  }

  function closePalette() {
    setQuery("");
    setActiveIndex(0);
    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-start justify-center bg-stone-950/45 px-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:pt-[10vh]" role="presentation">
      <button aria-label="Close Quick Study" className="absolute inset-0 cursor-default" onClick={closePalette} type="button" />
      <section aria-label="Quick Study" aria-modal="true" className="relative flex max-h-[min(42rem,calc(100vh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)] shadow-2xl" role="dialog">
        <div className="flex items-center gap-3 border-b border-[var(--line)] bg-white px-4 py-3">
          <Search className="shrink-0 text-[var(--green)]" size={20} />
          <label className="sr-only" htmlFor="quick-study-search">Find a study tool or workspace</label>
          <input
            id="quick-study-search"
            ref={inputRef}
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-[var(--ink)] outline-none placeholder:text-stone-400"
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, filteredCommands.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Enter" && filteredCommands[activeIndex]) {
                event.preventDefault();
                runCommand(filteredCommands[activeIndex]);
              }
            }}
            placeholder="Definitions, cross-references, sermons, hymns..."
            value={query}
          />
          <button aria-label="Close Quick Study" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--warm)]" onClick={closePalette} type="button">
            <X size={19} />
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--warm)] px-4 py-2 text-xs font-semibold text-[var(--muted)]">
          <span>Working from {selectedRef}</span>
          <span className="hidden items-center gap-1 sm:flex"><Command size={13} /> K opens Quick Study</span>
        </div>

        <div className="overflow-y-auto p-2">
          {filteredCommands.length ? (
            filteredCommands.map((command, index) => {
              const showGroup = index === 0 || filteredCommands[index - 1]?.group !== command.group;
              return (
                <div key={command.id}>
                  {showGroup && <p className="px-3 pb-1 pt-3 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{command.group}</p>}
                  <button
                    className={`grid min-h-16 w-full grid-cols-[2.5rem_1fr] items-center gap-3 rounded-md px-3 py-2 text-left ${activeIndex === index ? "bg-[var(--green)] text-white" : "text-[var(--ink)] hover:bg-white"}`}
                    onClick={() => runCommand(command)}
                    onMouseEnter={() => setActiveIndex(index)}
                    type="button"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-md ${activeIndex === index ? "bg-white/15" : "bg-[var(--warm)] text-[var(--green)]"}`}>{command.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{command.label}</span>
                      <span className={`mt-0.5 block text-xs leading-5 ${activeIndex === index ? "text-white/80" : "text-[var(--muted)]"}`}>{command.description}</span>
                    </span>
                  </button>
                </div>
              );
            })
          ) : (
            <p className="px-4 py-10 text-center text-sm font-semibold text-[var(--muted)]">No matching tool. Try a broader word.</p>
          )}
        </div>
      </section>
    </div>
  );
}
