"use client";

import { Clock } from "lucide-react";
import { theme } from "@/theme.config";
import { cn, formatDuration, formatPrice } from "@/lib/utils";
import type { Draft } from "./types";

interface Props {
  draft: Draft;
  onSelect: (serviceId: string) => void;
}

export function StepService({ draft, onSelect }: Props) {
  return (
    <div className="space-y-6">
      {theme.categories.map((category) => (
        <section key={category}>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{category}</h3>
          <ul className="mt-2 space-y-2">
            {theme.services
              .filter((s) => s.category === category)
              .map((s) => {
                const selected = draft.serviceId === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex w-full items-start justify-between gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary",
                        selected ? "border-primary ring-2 ring-primary" : "border-border",
                      )}
                    >
                      <span>
                        <span className="block font-medium">{s.name}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{s.description}</span>
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3.5" />
                          {formatDuration(s.durationMin)}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-primary">{formatPrice(s.price)}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
