"use client";

import { useMemo } from "react";
import { theme } from "@/theme.config";
import { useStore } from "@/lib/store";
import { availableSlots } from "@/lib/availability";
import { addDays, formatDate, weekday } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Draft } from "./types";

interface Props {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
}

const DAYS_AHEAD = 14;

export function StepSlot({ draft, onChange }: Props) {
  const { ready, today, bookings, rooms } = useStore();
  const service = theme.services.find((s) => s.id === draft.serviceId);

  const compatibleRooms = useMemo(
    () => rooms.filter((r) => r.active && service && r.categories.includes(service.category)),
    [rooms, service],
  );

  const days = useMemo(() => (ready ? Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)) : []), [ready, today]);

  const slots = useMemo(() => {
    if (!service || !draft.date || !draft.roomId || !draft.practitionerId) return [];
    return availableSlots({
      date: draft.date,
      practitionerId: draft.practitionerId,
      roomId: draft.roomId,
      durationMin: service.durationMin,
      bookings,
      opening: theme.opening,
    });
  }, [service, draft.date, draft.roomId, draft.practitionerId, bookings]);

  if (!ready) return <p className="text-sm text-muted-foreground">Chargement des disponibilités…</p>;

  if (compatibleRooms.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        Aucune salle n&apos;est disponible pour ce service pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-7">
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">1. Choisissez un jour</h3>
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-2">
          {days.map((d) => {
            const closed = theme.opening.closedDays.includes(weekday(d));
            const selected = draft.date === d;
            return (
              <button
                key={d}
                type="button"
                disabled={closed}
                aria-pressed={selected}
                onClick={() => onChange({ date: d, time: null })}
                className={cn(
                  "flex w-16 shrink-0 flex-col items-center rounded-lg border bg-card px-2 py-2.5 text-center transition-colors enabled:hover:border-primary disabled:opacity-40",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                <span className="text-xs capitalize">{formatDate(d, { weekday: "short" })}</span>
                <span className="text-xl font-semibold leading-tight">{formatDate(d, { day: "numeric" })}</span>
                <span className="text-xs">{closed ? "Fermé" : formatDate(d, { month: "short" })}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">2. Choisissez une salle</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {compatibleRooms.map((r) => {
            const selected = draft.roomId === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ roomId: r.id, time: null })}
                  className={cn(
                    "w-full rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary",
                    selected ? "border-primary ring-2 ring-primary" : "border-border",
                  )}
                >
                  <span className="block font-medium">{r.name}</span>
                  <span className="block text-sm text-muted-foreground">{r.description}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">3. Choisissez une heure</h3>
        {!draft.date || !draft.roomId ? (
          <p className="mt-2 text-sm text-muted-foreground">Sélectionnez d&apos;abord un jour et une salle.</p>
        ) : slots.length === 0 ? (
          <p className="mt-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Aucun créneau libre ce jour-là avec cette salle. Essayez un autre jour ou une autre salle.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={draft.time === t}
                onClick={() => onChange({ time: t })}
                className={cn(
                  "h-11 rounded-md border text-sm font-medium transition-colors hover:border-primary",
                  draft.time === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
