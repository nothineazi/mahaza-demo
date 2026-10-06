"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { theme } from "@/theme.config";
import type { Booking } from "@/data/types";
import { useStore } from "@/lib/store";
import { addDays, endTime, formatDate, formatDateLong, timeToMin, weekDays, weekday } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookingDialog } from "./booking-dialog";

type View = "jour" | "semaine";

const HOUR_PX = 64;

export function Planning() {
  const { ready, today, bookings, staff } = useStore();
  const [view, setView] = useState<View>("jour");
  const [date, setDate] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  if (!ready) return <p className="text-sm text-muted-foreground">Chargement du planning…</p>;

  const current = date ?? today;
  const step = view === "jour" ? 1 : 7;
  const days = weekDays(current);
  const label =
    view === "jour"
      ? formatDateLong(current)
      : `Semaine du ${formatDate(days[0], { day: "numeric", month: "long" })} au ${formatDate(days[6], { day: "numeric", month: "long" })}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(current, -step))} aria-label="Précédent">
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setDate(addDays(current, step))} aria-label="Suivant">
            <ChevronRight />
          </Button>
          <Button variant="outline" onClick={() => setDate(today)}>
            Aujourd&apos;hui
          </Button>
        </div>
        <div role="group" aria-label="Type de vue" className="inline-flex rounded-md border border-border p-0.5">
          {(["jour", "semaine"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "rounded-sm px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <h1 className="font-heading text-xl font-bold first-letter:uppercase">{label}</h1>

      {view === "jour" ? (
        <DayView date={current} bookings={bookings} onOpen={setOpenId} staffList={staff} />
      ) : (
        <WeekView
          days={days}
          today={today}
          bookings={bookings}
          onOpen={setOpenId}
          onPickDay={(d) => {
            setDate(d);
            setView("jour");
          }}
        />
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border-l-4 border-success bg-success/15" /> Acompte reçu</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-sm border-l-4 border-accent bg-accent/20" /> Acompte en attente</span>
      </div>

      <BookingDialog bookingId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function blockClasses(b: Booking) {
  return b.depositReceived ? "border-success bg-success/15" : "border-accent bg-accent/20";
}

function DayView({
  date,
  bookings,
  staffList,
  onOpen,
}: {
  date: string;
  bookings: Booking[];
  staffList: ReturnType<typeof useStore>["staff"];
  onOpen: (id: string) => void;
}) {
  const open = timeToMin(theme.opening.open);
  const close = timeToMin(theme.opening.close);
  const dayBookings = bookings.filter((b) => b.date === date);
  const columns = staffList.filter((p) => p.active || dayBookings.some((b) => b.practitionerId === p.id));
  const hours = Array.from({ length: Math.ceil((close - open) / 60) }, (_, i) => open + i * 60);
  const height = ((close - open) / 60) * HOUR_PX;

  if (dayBookings.length === 0) {
    return <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">Aucune réservation ce jour-là.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div className="flex" style={{ minWidth: 48 + columns.length * 150 }}>
        <div className="w-12 shrink-0 border-r border-border">
          <div className="h-10 border-b border-border" />
          <div className="relative" style={{ height }}>
            {hours.map((h) => (
              <span key={h} className="absolute right-1 -translate-y-1/2 text-[11px] text-muted-foreground" style={{ top: ((h - open) / 60) * HOUR_PX }}>
                {Math.floor(h / 60)}h
              </span>
            ))}
          </div>
        </div>
        {columns.map((p) => (
          <div key={p.id} className="min-w-[150px] flex-1 border-r border-border last:border-r-0">
            <div className="flex h-10 flex-col items-center justify-center border-b border-border text-center leading-tight">
              <span className="text-sm font-semibold">{p.name}</span>
              <span className="text-[10px] text-muted-foreground">{p.role}</span>
            </div>
            <div className="relative" style={{ height }}>
              {hours.map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-border/60" style={{ top: ((h - open) / 60) * HOUR_PX }} />
              ))}
              {dayBookings
                .filter((b) => b.practitionerId === p.id)
                .map((b) => {
                  const service = theme.services.find((s) => s.id === b.serviceId);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onOpen(b.id)}
                      className={cn("absolute inset-x-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs transition-opacity hover:opacity-80", blockClasses(b))}
                      style={{ top: ((timeToMin(b.start) - open) / 60) * HOUR_PX + 1, height: (b.durationMin / 60) * HOUR_PX - 2 }}
                    >
                      <span className="block font-semibold">{b.start} – {endTime(b.start, b.durationMin)}</span>
                      <span className="block truncate">{service?.name}</span>
                      <span className="block truncate text-muted-foreground">{b.customerName}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekView({
  days,
  today,
  bookings,
  onOpen,
  onPickDay,
}: {
  days: string[];
  today: string;
  bookings: Booking[];
  onOpen: (id: string) => void;
  onPickDay: (d: string) => void;
}) {
  const { staff } = useStore();
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <div className="grid min-w-[980px] grid-cols-7">
        {days.map((d) => {
          const list = bookings.filter((b) => b.date === d).sort((a, b) => a.start.localeCompare(b.start));
          const closed = theme.opening.closedDays.includes(weekday(d));
          return (
            <div key={d} className="border-r border-border last:border-r-0">
              <button
                type="button"
                onClick={() => onPickDay(d)}
                className={cn(
                  "flex w-full flex-col items-center border-b border-border py-2 text-sm transition-colors hover:bg-muted",
                  d === today && "bg-secondary font-semibold text-secondary-foreground",
                )}
              >
                <span className="capitalize">{formatDate(d, { weekday: "short" })}</span>
                <span className="text-lg font-semibold leading-tight">{formatDate(d, { day: "numeric" })}</span>
                <span className="text-[11px] text-muted-foreground">{closed ? "Fermé" : `${list.length} résa`}</span>
              </button>
              <ul className="min-h-24 space-y-1.5 p-1.5">
                {list.map((b) => {
                  const service = theme.services.find((s) => s.id === b.serviceId);
                  const practitioner = staff.find((p) => p.id === b.practitionerId);
                  return (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => onOpen(b.id)}
                        className={cn("w-full rounded-md border-l-4 px-2 py-1 text-left text-xs transition-opacity hover:opacity-80", blockClasses(b))}
                      >
                        <span className="block font-semibold">{b.start}</span>
                        <span className="block truncate">{service?.name}</span>
                        <span className="block truncate text-muted-foreground">{b.customerName} · {practitioner?.name.split(" ")[0]}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
