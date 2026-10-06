"use client";

import { MapPin } from "lucide-react";
import { sites } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import type { Draft } from "./types";

/** Étape « choix du spa » : un spa choisi fait avancer directement. */
export function StepSite({ draft, onSelect }: { draft: Draft; onSelect: (siteId: string) => void }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {sites.map((site) => {
        const selected = draft.siteId === site.id;
        return (
          <li key={site.id}>
            <button
              type="button"
              onClick={() => onSelect(site.id)}
              aria-pressed={selected}
              className="group block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Card interactive className={cn("flex items-start gap-4 p-5", selected && "border-primary ring-1 ring-primary")}>
                <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors group-hover:bg-accent">
                  <MapPin className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-heading text-2xl font-medium leading-tight">{site.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{site.address}</span>
                </span>
              </Card>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
