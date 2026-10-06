"use client";

import { theme } from "@/theme.config";
import { useStore } from "@/lib/store";
import { belongsToSite } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { FictiveBadge } from "@/components/fictive-badge";
import type { Draft } from "./types";

interface Props {
  draft: Draft;
  onSelect: (practitionerId: string) => void;
}

export function StepPractitioner({ draft, onSelect }: Props) {
  const { staff } = useStore();
  const service = theme.services.find((s) => s.id === draft.serviceId);
  const options = staff.filter((p) => p.active && belongsToSite(p, draft.siteId ?? "") && draft.serviceId && p.serviceIds.includes(draft.serviceId));

  if (options.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Aucun praticien n&apos;est disponible pour « {service?.name} » pour le moment. Choisissez un autre service.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {options.map((p) => {
        const selected = draft.practitionerId === p.id;
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={selected}
              className={cn(
                "flex w-full items-center gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary",
                selected ? "border-primary ring-2 ring-primary" : "border-border",
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-lg font-bold text-secondary-foreground">
                {p.name.charAt(0)}
              </span>
              <span>
                <span className={p.fictive ? "flex flex-wrap items-center gap-2 font-medium" : "block font-medium"}>{p.name}{p.fictive && <FictiveBadge />}</span>
                <span className="block text-sm text-muted-foreground">{p.role}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
