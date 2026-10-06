import * as React from "react";
import type { BookingStatus } from "@/data/types";
import { STATUS_LABELS } from "@/lib/mahaza/status";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "gold" | "success" | "danger" | "soft";

const TONES: Record<Tone, string> = {
  neutral: "border-border bg-card text-foreground",
  gold: "border-transparent bg-accent/25 text-foreground",
  success: "border-transparent bg-success/12 text-success",
  danger: "border-transparent bg-destructive/10 text-destructive",
  soft: "border-transparent bg-secondary text-secondary-foreground",
};

export function Pill({ tone = "neutral", className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", TONES[tone], className)} {...props} />;
}

const STATUS_TONE: Record<BookingStatus, Tone> = {
  pending_deposit: "gold",
  confirmed: "success",
  completed: "soft",
  cancelled: "danger",
  no_show: "danger",
};

/** Le statut est toujours rendu en toutes lettres (la couleur n'est jamais seule porteuse du sens). */
export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <Pill tone={STATUS_TONE[status]} className={className}>
      <span aria-hidden className={cn("size-1.5 rounded-full bg-current")} />
      {STATUS_LABELS[status]}
    </Pill>
  );
}
