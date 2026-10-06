"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Hourglass, MessageCircle, Percent, Wallet } from "lucide-react";
import { theme } from "@/theme.config";
import type { Reservation } from "@/data/types";
import { useAdminData } from "@/lib/mahaza/store";
import { activeReservations, estimatedRevenue, occupancyRate, pendingDeposits, periodDays, remindersDue, upcoming, weekBreakdown, type KpiContext, type Period } from "@/lib/mahaza/kpis";
import { formatCountdown, remainingMs } from "@/lib/mahaza/holds";
import { reminderLink } from "@/lib/mahaza/reminders";
import { reservationEnd } from "@/lib/mahaza/scheduling";
import { useNow } from "@/lib/mahaza/use-now";
import { nowMinutes, formatDate, formatDateLong, formatDateShort } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { FictiveBadge } from "@/components/fictive-badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Skeleton, LoadingRegion } from "../ui/skeleton";
import { StatusPill } from "../ui/pill";
import { ReservationDialog } from "./reservation-dialog";

const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)} %`);

export function Dashboard() {
  const data = useAdminData();
  const { ready, today, reservations, staff, site, markReminderSent } = data;
  const [period, setPeriod] = useState<Period>("day");
  const [openId, setOpenId] = useState<string | null>(null);
  const now = useNow(1000);

  const ctx = useMemo<KpiContext>(
    () => ({ reservations, staff, services: theme.services, opening: theme.opening, premium: theme.premium!, today, nowMs: now }),
    [reservations, staff, today, now],
  );

  if (!ready) {
    return (
      <LoadingRegion label="Chargement du tableau de bord">
        <Skeleton className="mb-6 h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </LoadingRegion>
    );
  }

  const days = periodDays(period, today);
  const label = period === "day" ? "aujourd'hui" : "cette semaine";
  const active = activeReservations(ctx, days);
  const pendingAll = pendingDeposits(reservations);
  const occupancy = occupancyRate(ctx, days);
  const revenue = estimatedRevenue(ctx, days);
  const next = upcoming(reservations, today, nowMinutes());
  const reminders = remindersDue(reservations, today);
  const week = weekBreakdown(ctx);
  const rctx = { brand: theme.name, siteName: site.name, services: theme.services, staff };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-medium">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {site.name} · <span className="first-letter:uppercase">{formatDateLong(today)}</span>
          </p>
        </div>
        <div role="group" aria-label="Période" className="inline-flex rounded-full border border-border bg-card p-1">
          {(["day", "week"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={cn("min-h-10 rounded-full px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", period === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {p === "day" ? "Jour" : "Semaine"}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="Indicateurs" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CalendarCheck} label={`Réservations ${label}`} value={String(active.length)} note={`dont ${active.filter((r) => r.status === "pending_deposit").length} en attente d'acompte`} />
        <Kpi
          icon={Hourglass}
          label="Acomptes en attente"
          value={String(pendingAll.count)}
          note={pendingAll.count ? `${formatPrice(pendingAll.amount)}${pendingAll.nextExpiry && now ? ` · prochaine expiration dans ${formatCountdown(remainingMs(pendingAll.nextExpiry, now))}` : ""}` : "Aucun acompte en attente"}
        />
        <Kpi icon={Percent} label={`Taux de remplissage ${label}`} value={pct(occupancy)} note="Minutes réservées ÷ minutes d'ouverture × praticiens actifs (créneaux de 60 min indicatifs)">
          {occupancy != null && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-border" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(occupancy * 100)} aria-label="Taux de remplissage">
              <div className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${Math.round(occupancy * 100)}%` }} />
            </div>
          )}
        </Kpi>
        <Kpi icon={Wallet} label={`CA estimé ${label}`} value={formatPrice(revenue)} note="Réservations confirmées ou terminées × barème fictif par catégorie : aucun prix réel connu" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-heading text-2xl font-medium">Prochains rendez-vous</h2>
          {next.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucun rendez-vous à venir pour ce spa.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {next.map((r) => (
                <ReservationRow key={r.id} r={r} onOpen={setOpenId} />
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-heading text-2xl font-medium">Rappels J-1 à envoyer</h2>
          <p className="mt-1 text-xs text-muted-foreground">Rendez-vous de demain, confirmés ou en attente d&apos;acompte. L&apos;envoi se fait depuis WhatsApp.</p>
          {reminders.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucun rendez-vous demain : rien à rappeler.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {reminders.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{r.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {r.lines[0].start} · {r.lines.map((l) => theme.services.find((s) => s.id === l.serviceId)?.name).join(" + ")}
                    </p>
                    {r.reminderSentAt != null && <p className="text-xs text-success">Rappel ouvert dans WhatsApp ✓</p>}
                  </div>
                  <Button asChild variant="whatsapp" size="sm">
                    <a href={reminderLink(r, rctx)} target="_blank" rel="noopener noreferrer" onClick={() => markReminderSent(r.id)}>
                      <MessageCircle /> {r.reminderSentAt != null ? "Renvoyer" : "Rappeler"}
                      <span className="sr-only"> {r.customerName}</span>
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <WeekChart days={week} today={today} />

      <ReservationDialog reservationId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, note, children }: { icon: typeof Percent; label: string; value: string; note: string; children?: React.ReactNode }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="size-4 text-primary" aria-hidden /> {label}
        </p>
        <FictiveBadge />
      </div>
      <p className="mt-3 font-sans text-3xl font-semibold tracking-tight">{value}</p>
      {children}
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{note}</p>
    </Card>
  );
}

function ReservationRow({ r, onOpen }: { r: Reservation; onOpen: (id: string) => void }) {
  return (
    <li>
      <button type="button" onClick={() => onOpen(r.id)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="min-w-0">
          <span className="block font-medium">{r.customerName}</span>
          <span className="block truncate text-sm text-muted-foreground">
            <span className="first-letter:uppercase">{formatDateShort(r.date)}</span> · {r.lines[0].start} – {reservationEnd(r.lines)} · {r.lines.map((l) => theme.services.find((s) => s.id === l.serviceId)?.name).join(" + ")}
          </span>
        </span>
        <StatusPill status={r.status} className="shrink-0" />
      </button>
    </li>
  );
}

/** Réservations par jour de la semaine : une seule série (même teinte), barres fines, étiquettes sélectives, tableau équivalent. */
function WeekChart({ days, today }: { days: ReturnType<typeof weekBreakdown>; today: string }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const peak = days.reduce((a, b) => (b.count > a.count ? b : a), days[0]);
  const H = 140;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-2xl font-medium">Réservations de la semaine</h2>
        <FictiveBadge />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Hors annulées. Survolez ou focalisez une barre pour le détail.</p>
      <ul className="relative mt-5 flex items-end justify-between gap-2 border-b border-border" style={{ height: H + 36 }} aria-label="Graphique : réservations par jour">
        <li aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-border/70" style={{ bottom: 36 + H }}>
          <span className="absolute -top-5 left-0 text-[11px] text-muted-foreground">{max}</span>
        </li>
        {days.map((d) => {
          const h = Math.round((d.count / max) * H);
          const isToday = d.date === today;
          const labelled = d.count > 0 && (d.date === peak.date || isToday);
          return (
            <li key={d.date} tabIndex={0} className="group relative flex h-full flex-1 flex-col items-center justify-end rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${formatDateShort(d.date)} : ${d.count} réservation${d.count > 1 ? "s" : ""}`}>
              <span role="tooltip" className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-xs text-background opacity-0 shadow-lift transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                {d.count} réservation{d.count > 1 ? "s" : ""} · CA estimé {formatPrice(d.revenue)} (FICTIF)
              </span>
              {labelled && <span className="mb-1 text-xs font-semibold">{d.count}</span>}
              <span className="block w-full max-w-6 rounded-t-[4px] bg-primary transition-[height] duration-700 motion-reduce:transition-none" style={{ height: Math.max(h, d.count > 0 ? 2 : 0) }} />
              <span className={cn("mt-2 h-7 text-xs capitalize", isToday ? "font-semibold text-foreground" : "text-muted-foreground")} aria-hidden>
                {formatDate(d.date, { weekday: "short" })}
              </span>
            </li>
          );
        })}
      </ul>
      <details className="mt-4">
        <summary className="min-h-11 cursor-pointer py-2 text-sm text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Voir les valeurs en tableau</summary>
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">Réservations et chiffre d&apos;affaires estimé (fictif) par jour</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="py-1 font-medium">Jour</th>
              <th scope="col" className="py-1 font-medium">Réservations</th>
              <th scope="col" className="py-1 text-right font-medium">CA estimé (FICTIF)</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date} className="border-t border-border">
                <th scope="row" className="py-1.5 text-left font-normal capitalize">{formatDate(d.date, { weekday: "long", day: "numeric", month: "short" })}</th>
                <td className="py-1.5">{d.count}</td>
                <td className="py-1.5 text-right tabular-nums">{formatPrice(d.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  );
}
