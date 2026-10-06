"use client";

import { useState } from "react";
import { CalendarOff, ChevronLeft, ChevronRight } from "lucide-react";
import { theme } from "@/theme.config";
import type { BookingStatus, Reservation, ReservationLine } from "@/data/types";
import { useAdminData } from "@/lib/mahaza/store";
import { hoursFor } from "@/lib/availability";
import { reservationEnd } from "@/lib/mahaza/scheduling";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/mahaza/status";
import { addDays, endTime, formatDate, formatDateLong, timeToMin, weekDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Skeleton, LoadingRegion } from "../ui/skeleton";
import { StatusPill } from "../ui/pill";
import { ReservationDialog } from "./reservation-dialog";

type View = "jour" | "semaine";
type GroupBy = "praticien" | "salle";

const HOUR_PX = 64;

const BLOCK: Record<BookingStatus, string> = {
  pending_deposit: "border-accent bg-accent/25",
  confirmed: "border-success bg-success/15",
  completed: "border-muted-foreground bg-muted",
  cancelled: "border-destructive bg-destructive/10",
  no_show: "border-destructive bg-destructive/10 opacity-80",
};

const serviceName = (id: string) => theme.services.find((s) => s.id === id)?.name ?? id;

export function Planning() {
  const { ready, today, reservations, staff, rooms } = useAdminData();
  const [view, setView] = useState<View>("jour");
  const [groupBy, setGroupBy] = useState<GroupBy>("praticien");
  const [date, setDate] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!ready) {
    return (
      <LoadingRegion label="Chargement du planning">
        <Skeleton className="mb-4 h-12 w-80" />
        <Skeleton className="h-[480px]" />
      </LoadingRegion>
    );
  }

  const current = date ?? today;
  const step = view === "jour" ? 1 : 7;
  const days = weekDays(current);
  const label = view === "jour" ? formatDateLong(current) : `Semaine du ${formatDate(days[0], { day: "numeric", month: "long" })} au ${formatDate(days[6], { day: "numeric", month: "long" })}`;

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-4xl font-medium">Planning</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(current, -step))} aria-label={view === "jour" ? "Jour précédent" : "Semaine précédente"}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(current, step))} aria-label={view === "jour" ? "Jour suivant" : "Semaine suivante"}>
            <ChevronRight />
          </Button>
          <Button variant="outline" onClick={() => setDate(today)}>
            Aujourd&apos;hui
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {view === "jour" && <Segmented label="Colonnes" value={groupBy} onChange={setGroupBy} options={[["praticien", "Praticiens"], ["salle", "Salles"]]} className="hidden md:inline-flex" />}
          <Segmented label="Type de vue" value={view} onChange={setView} options={[["jour", "Jour"], ["semaine", "Semaine"]]} />
        </div>
      </div>

      <h2 className="font-heading text-2xl font-medium first-letter:uppercase">{label}</h2>

      {view === "jour" ? (
        <DayView date={current} reservations={reservations} staff={staff} rooms={rooms} groupBy={groupBy} onOpen={setOpenId} />
      ) : (
        <WeekView
          days={days}
          today={today}
          reservations={reservations}
          onOpen={setOpenId}
          onPickDay={(d) => {
            setDate(d);
            setView("jour");
          }}
        />
      )}

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Légende des statuts">
        {STATUS_ORDER.filter((s) => s !== "cancelled").map((s) => (
          <li key={s} className="inline-flex items-center gap-1.5">
            <span className={cn("size-3 rounded-sm border-l-4", BLOCK[s])} /> {STATUS_LABELS[s]}
          </li>
        ))}
        <li>Les réservations annulées libèrent le créneau et ne sont pas affichées.</li>
      </ul>

      <ReservationDialog reservationId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function Segmented<T extends string>({ label, value, onChange, options, className }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][]; className?: string }) {
  return (
    <div role="group" aria-label={label} className={cn("inline-flex rounded-full border border-border bg-card p-1", className)}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn("min-h-10 rounded-full px-4 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", value === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

interface Entry {
  r: Reservation;
  l: ReservationLine;
}

function DayView({ date, reservations, staff, rooms, groupBy, onOpen }: { date: string; reservations: Reservation[]; staff: ReturnType<typeof useAdminData>["staff"]; rooms: ReturnType<typeof useAdminData>["rooms"]; groupBy: GroupBy; onOpen: (id: string) => void }) {
  const hours = hoursFor(theme.opening, date);
  const dayRes = reservations.filter((r) => r.date === date);
  const entries: Entry[] = dayRes.filter((r) => r.status !== "cancelled").flatMap((r) => r.lines.map((l) => ({ r, l }))).sort((a, b) => a.l.start.localeCompare(b.l.start));
  const hiddenCancelled = dayRes.filter((r) => r.status === "cancelled").length;

  if (!hours) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <CalendarOff className="size-8 text-muted-foreground" aria-hidden />
        <p className="font-heading text-2xl font-medium">Spa fermé ce jour-là</p>
      </Card>
    );
  }
  if (entries.length === 0) {
    return (
      <Card className="p-10 text-center">
        <p className="font-heading text-2xl font-medium">Aucune réservation ce jour-là</p>
        {hiddenCancelled > 0 && <p className="mt-1 text-sm text-muted-foreground">{hiddenCancelled} réservation(s) annulée(s) masquée(s).</p>}
      </Card>
    );
  }

  const open = Math.floor(timeToMin(hours.open) / 60) * 60;
  const close = Math.ceil(timeToMin(hours.close) / 60) * 60;
  const hourMarks = Array.from({ length: Math.ceil((close - open) / 60) }, (_, i) => open + i * 60);
  const height = ((close - open) / 60) * HOUR_PX;
  const columns =
    groupBy === "praticien"
      ? staff.filter((p) => p.active || entries.some((e) => e.l.practitionerId === p.id)).map((p) => ({ id: p.id, title: p.name, sub: p.role, match: (e: Entry) => e.l.practitionerId === p.id }))
      : rooms.filter((x) => x.active || entries.some((e) => e.l.roomId === x.id)).map((x) => ({ id: x.id, title: x.name, sub: "", match: (e: Entry) => e.l.roomId === x.id }));

  return (
    <>
      {/* Mobile : agenda chronologique */}
      <ul className="space-y-2 md:hidden" aria-label="Agenda du jour">
        {entries.map(({ r, l }) => (
          <li key={`${r.id}-${l.serviceId}`}>
            <button type="button" onClick={() => onOpen(r.id)} className={cn("w-full rounded-2xl border-l-4 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", BLOCK[r.status])}>
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold">{l.start} – {endTime(l.start, l.durationMin)}</span>
                <StatusPill status={r.status} />
              </span>
              <span className="mt-1 block">{serviceName(l.serviceId)}</span>
              <span className="block text-sm text-muted-foreground">
                {r.customerName} · {staff.find((p) => p.id === l.practitionerId)?.name ?? "—"} · {rooms.find((x) => x.id === l.roomId)?.name ?? "—"}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Desktop : grille par praticien ou par salle */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card shadow-soft md:block">
        <div className="flex" style={{ minWidth: 56 + columns.length * 150 }}>
          <div className="w-14 shrink-0 border-r border-border">
            <div className="h-12 border-b border-border" />
            <div className="relative" style={{ height }}>
              {hourMarks.map((h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: ((h - open) / 60) * HOUR_PX }}>
                  {Math.floor(h / 60)}h
                </span>
              ))}
            </div>
          </div>
          {columns.map((c) => (
            <div key={c.id} className="min-w-[150px] flex-1 border-r border-border last:border-r-0">
              <div className="flex h-12 flex-col items-center justify-center border-b border-border px-1 text-center leading-tight">
                <span className="text-sm font-semibold">{c.title}</span>
                {c.sub && <span className="text-[11px] text-muted-foreground">{c.sub}</span>}
              </div>
              <div className="relative" style={{ height }}>
                {hourMarks.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: ((h - open) / 60) * HOUR_PX }} />
                ))}
                {entries.filter(c.match).map(({ r, l }) => (
                  <button
                    key={`${r.id}-${l.serviceId}`}
                    type="button"
                    onClick={() => onOpen(r.id)}
                    title={`${r.customerName} · ${STATUS_LABELS[r.status]}`}
                    className={cn("absolute inset-x-1 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left text-xs transition-shadow duration-200 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", BLOCK[r.status])}
                    style={{ top: ((timeToMin(l.start) - open) / 60) * HOUR_PX + 1, height: (l.durationMin / 60) * HOUR_PX - 2 }}
                  >
                    <span className="block font-semibold">{l.start} – {endTime(l.start, l.durationMin)}</span>
                    <span className="block truncate">{serviceName(l.serviceId)}</span>
                    <span className="block truncate text-muted-foreground">{r.customerName}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {hiddenCancelled > 0 && <p className="text-xs text-muted-foreground">{hiddenCancelled} réservation(s) annulée(s) masquée(s) ce jour-là.</p>}
    </>
  );
}

function WeekView({ days, today, reservations, onOpen, onPickDay }: { days: string[]; today: string; reservations: Reservation[]; onOpen: (id: string) => void; onPickDay: (d: string) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-7 md:gap-0 md:overflow-hidden md:rounded-2xl md:border md:border-border md:bg-card md:shadow-soft">
      {days.map((d) => {
        const list = reservations.filter((r) => r.date === d && r.status !== "cancelled").sort((a, b) => a.lines[0].start.localeCompare(b.lines[0].start));
        const closed = hoursFor(theme.opening, d) === null;
        return (
          <section key={d} aria-label={formatDateLong(d)} className="rounded-2xl border border-border bg-card md:rounded-none md:border-0 md:border-r md:last:border-r-0">
            <button
              type="button"
              onClick={() => onPickDay(d)}
              className={cn("flex min-h-16 w-full items-center justify-between border-b border-border px-3 py-2 text-sm transition-colors hover:bg-muted md:flex-col md:justify-center", d === today && "bg-secondary font-semibold text-secondary-foreground")}
            >
              <span className="capitalize">{formatDate(d, { weekday: "short" })}</span>
              <span className="font-heading text-2xl font-medium leading-tight">{formatDate(d, { day: "numeric" })}</span>
              <span className="text-[11px] text-muted-foreground">{closed ? "Fermé" : `${list.length} résa`}</span>
            </button>
            <ul className="min-h-12 space-y-1.5 p-1.5 md:min-h-40">
              {list.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => onOpen(r.id)} className={cn("w-full rounded-lg border-l-4 px-2 py-1.5 text-left text-xs transition-shadow hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", BLOCK[r.status])}>
                    <span className="block font-semibold">{r.lines[0].start} – {reservationEnd(r.lines)}</span>
                    <span className="block truncate">{r.lines.map((l) => serviceName(l.serviceId)).join(" + ")}</span>
                    <span className="block truncate text-muted-foreground">{r.customerName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
