"use client";

import { MapPin } from "lucide-react";
import { sites } from "@/lib/sites";
import { cn } from "@/lib/utils";
import type { Draft } from "./types";

interface Props {
  draft: Draft;
  onSelect: (siteId: string) => void;
}

/** Étape « choix du spa » (uniquement pour les marques multi-sites). */
export function StepSite({ draft, onSelect }: Props) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {sites.map((site) => {
        const selected = draft.siteId === site.id;
        return (
          <li key={site.id}>
            <button
              type="button"
              onClick={() => onSelect(site.id)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary",
                selected ? "border-primary ring-2 ring-primary" : "border-border",
              )}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <MapPin className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block font-medium">{site.name}</span>
                <span className="block text-sm text-muted-foreground">{site.address}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
