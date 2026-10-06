"use client";

import { Clock } from "lucide-react";
import type { Reservation } from "@/data/types";
import { formatCountdown, remainingMs } from "@/lib/mahaza/holds";
import { useNow } from "@/lib/mahaza/use-now";
import { cn } from "@/lib/utils";

/**
 * Compte à rebours d'expiration de l'acompte (délai FICTIF configurable).
 * Barre dégressive + minuteur textuel ; annonce aux lecteurs d'écran une fois par minute seulement.
 */
export function DepositCountdown({ reservation }: { reservation: Reservation }) {
  const now = useNow(1000);
  if (reservation.holdExpiresAt == null || now === 0) return null;
  const left = remainingMs(reservation.holdExpiresAt, now);
  const total = Math.max(1, reservation.holdExpiresAt - reservation.createdAt);
  const pct = Math.min(100, Math.max(0, (left / total) * 100));
  const minutes = Math.ceil(left / 60_000);
  const urgent = left < 5 * 60_000;

  return (
    <div className={cn("space-y-3 rounded-2xl border p-5", urgent ? "border-destructive/50 bg-destructive/5" : "border-primary/40 bg-secondary")}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Clock className="size-4" aria-hidden /> Acompte à envoyer avant l&apos;expiration
        </p>
        <p role="timer" aria-live="off" aria-label="Temps restant avant expiration de l'acompte" className={cn("font-heading text-4xl font-medium tabular-nums", urgent && "text-destructive")}>
          {formatCountdown(left)}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className={cn("h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none", urgent ? "bg-destructive" : "bg-primary")} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        Sans réception de l&apos;acompte, le créneau est libéré automatiquement (délai FICTIF de démonstration, configurable).
      </p>
      <p className="sr-only" aria-live="polite">
        Il vous reste {minutes} minute{minutes > 1 ? "s" : ""} pour envoyer l&apos;acompte.
      </p>
    </div>
  );
}
