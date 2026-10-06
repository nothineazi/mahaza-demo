"use client";

import { useMemo } from "react";
import { CalendarX2, Info } from "lucide-react";
import { theme } from "@/theme.config";
import type { ReservationLine } from "@/data/types";
import { useMahazaStore } from "@/lib/mahaza/store";
import { availableStarts, type PlanContext } from "@/lib/mahaza/scheduling";
import { hoursFor } from "@/lib/availability";
import { addDays, endTime, formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { Skeleton, LoadingRegion } from "../ui/skeleton";
import { wantedFromDraft, type Draft } from "./types";

const DAYS_AHEAD = 14;

interface Props {
  draft: Draft;
  ctx: PlanContext;
  lines: ReservationLine[] | null;
  onChange: (patch: Partial<Draft>) => void;
  /** Réservation à ignorer (modification d'un rendez-vous existant). */
  ignoreId?: string;
}

/** Jour + heure pour l'ensemble du panier ; la salle et le praticien « sans préférence » sont attribués automatiquement. */
export function StepSlot({ draft, ctx, lines, onChange, ignoreId }: Props) {
  const { ready, today, staff, rooms } = useMahazaStore();
  const wanted = useMemo(() => wantedFromDraft(draft), [draft]);

  const days = useMemo(() => (ready ? Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i)) : []), [ready, today]);
  const startsByDay = useMemo(() => new Map(days.map((d) => [d, availableStarts(ctx, d, wanted, ignoreId)])), [days, ctx, wanted, ignoreId]);
  const starts = draft.date ? (startsByDay.get(draft.date) ?? []) : [];

  if (!ready) {
    return (
      <LoadingRegion label="Chargement des disponibilités">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-24 w-[72px] shrink-0 rounded-2xl" />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-12 rounded-full" />
          ))}
        </div>
      </LoadingRegion>
    );
  }

  return (
    <div className="space-y-10">
      <section aria-labelledby="slot-day">
        <h2 id="slot-day" className="font-heading text-2xl font-medium">1. Le jour</h2>
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {days.map((d) => {
            const closed = hoursFor(theme.opening, d) === null;
            const count = startsByDay.get(d)?.length ?? 0;
            const full = !closed && count === 0;
            const selected = draft.date === d;
            return (
              <button
                key={d}
                type="button"
                disabled={closed || full}
                aria-pressed={selected}
                onClick={() => onChange({ date: d, time: null })}
                className={cn(
                  "flex min-h-[88px] w-[76px] shrink-0 flex-col items-center justify-center rounded-2xl border px-2 py-2.5 text-center transition-[background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card enabled:hover:border-primary",
                )}
              >
                <span className="text-xs capitalize">{formatDate(d, { weekday: "short" })}</span>
                <span className="font-heading text-3xl font-medium leading-none">{formatDate(d, { day: "numeric" })}</span>
                <span className="mt-0.5 text-[11px]">{closed ? "Fermé" : full ? "Complet" : formatDate(d, { month: "short" })}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="slot-time">
        <h2 id="slot-time" className="font-heading text-2xl font-medium">2. L&apos;heure de début</h2>
        {!draft.date ? (
          <p className="mt-3 text-sm text-muted-foreground">Sélectionnez d&apos;abord un jour.</p>
        ) : starts.length === 0 ? (
          <Card className="mt-3 flex flex-col items-center gap-2 p-8 text-center">
            <CalendarX2 className="size-8 text-muted-foreground" aria-hidden />
            <p className="font-heading text-2xl font-medium">Aucun créneau ce jour-là</p>
            <p className="text-sm text-muted-foreground">Essayez un autre jour, ou allégez votre panier : plusieurs soins demandent un créneau plus long.</p>
          </Card>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {starts.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={draft.time === t}
                onClick={() => onChange({ time: t })}
                className={cn(
                  "min-h-12 rounded-full border text-sm font-medium transition-[background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  draft.time === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </section>

      {lines && lines.length > 0 && (
        <section aria-labelledby="slot-plan" className="lux-fade">
          <h2 id="slot-plan" className="font-heading text-2xl font-medium">Votre enchaînement</h2>
          <ol className="mt-3 space-y-2">
            {lines.map((l) => {
              const service = theme.services.find((s) => s.id === l.serviceId);
              const practitioner = staff.find((p) => p.id === l.practitionerId);
              const room = rooms.find((r) => r.id === l.roomId);
              return (
                <li key={l.serviceId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl border border-border bg-card px-5 py-3">
                  <span>
                    <span className="block font-medium">{service?.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {practitioner?.name ?? "—"}{l.noPreference ? " (attribué automatiquement)" : ""} · {room?.name ?? "—"}
                    </span>
                  </span>
                  <span className="text-sm font-medium">
                    {l.start} – {endTime(l.start, l.durationMin)}
                    {service?.durationMin == null && <span className="font-normal text-muted-foreground"> (indicatif)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 flex gap-2 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Praticiens et salles : données FICTIVES de démonstration. Les durées de soins sont à confirmer par {theme.name}.
          </p>
        </section>
      )}
    </div>
  );
}
