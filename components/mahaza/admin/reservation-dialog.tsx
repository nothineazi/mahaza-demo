"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRightLeft, Clock, MessageCircle, UserRound } from "lucide-react";
import { theme } from "@/theme.config";
import type { BookingStatus, Reservation } from "@/data/types";
import { useMahazaStore, type Result } from "@/lib/mahaza/store";
import { TRANSITIONS, checkTransition } from "@/lib/mahaza/lifecycle";
import { transitionLabel } from "@/lib/mahaza/status";
import { buildMovedLines, findConflicts, hasBlocking, type Conflict } from "@/lib/mahaza/conflicts";
import { formatCountdown, remainingMs } from "@/lib/mahaza/holds";
import { reminderLink } from "@/lib/mahaza/reminders";
import { reservationEnd } from "@/lib/mahaza/scheduling";
import { useNow } from "@/lib/mahaza/use-now";
import { hoursFor } from "@/lib/availability";
import { addDays, endTime, formatDateLong, minToTime, timeToMin } from "@/lib/dates";
import { getSite, multiSite } from "@/lib/sites";
import { cn, formatPrice } from "@/lib/utils";
import { FictiveBadge } from "@/components/fictive-badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { FieldLabel, Input, Select } from "../ui/field";
import { StatusPill } from "../ui/pill";

const hhmm = (ms: number) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Douala" }).format(ms);

/** Détail d'une réservation : cycle de vie, déplacement (avec détection de conflit), rappel WhatsApp J-1. */
export function ReservationDialog({ reservationId, onClose }: { reservationId: string | null; onClose: () => void }) {
  const { reservations } = useMahazaStore();
  const reservation = reservations.find((r) => r.id === reservationId);
  return (
    <Dialog open={Boolean(reservation)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent variant="sheet" className="sm:max-w-2xl">
        {reservation && <Detail key={reservation.id} reservation={reservation} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function Detail({ reservation, onClose }: { reservation: Reservation; onClose: () => void }) {
  const store = useMahazaStore();
  const router = useRouter();
  const { staff, rooms, today, setStatus, markReminderSent, setFocusClientId } = store;
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string; conflicts?: Conflict[] } | null>(null);
  const [moving, setMoving] = useState(false);
  const site = getSite(reservation.siteId);
  const status = reservation.status;
  const rctx = { brand: theme.name, siteName: site.name, services: theme.services, staff };

  const apply = (to: BookingStatus) => {
    const res: Result = setStatus(reservation.id, to);
    setMessage(res.ok ? { tone: "ok", text: `Statut mis à jour : ${transitionLabel(status, to)}.` } : { tone: "error", text: res.reason, conflicts: res.conflicts });
  };

  const tomorrow = reservation.date === addDays(today, 1);
  const canRemind = status === "confirmed" || status === "pending_deposit";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{reservation.lines.map((l) => theme.services.find((s) => s.id === l.serviceId)?.name).join(" + ")}</DialogTitle>
        <DialogDescription asChild>
          <div className="flex flex-wrap items-center gap-2">
            <span>Réf. {reservation.reference}</span>
            <StatusPill status={status} />
            {reservation.fictive && <FictiveBadge />}
          </div>
        </DialogDescription>
      </DialogHeader>

      <dl className="divide-y divide-border rounded-2xl border border-border text-sm">
        <Row k="Client">
          <button
            type="button"
            onClick={() => {
              setFocusClientId(reservation.clientId);
              onClose();
              router.push("/admin/clients");
            }}
            className="inline-flex min-h-8 items-center gap-1.5 font-medium text-primary underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserRound className="size-4" aria-hidden /> {reservation.customerName}
          </button>
          <span className="block text-muted-foreground">{reservation.customerPhone}</span>
        </Row>
        {multiSite && <Row k="Spa">{site.name}</Row>}
        <Row k="Quand">
          <span className="first-letter:uppercase">{formatDateLong(reservation.date)}</span>, {reservation.lines[0].start} – {reservationEnd(reservation.lines)} <span className="text-muted-foreground">(indicatif)</span>
        </Row>
        <Row k="Soins">
          <ul className="space-y-1">
            {reservation.lines.map((l) => (
              <li key={l.serviceId}>
                <span className="font-medium">{l.start} – {endTime(l.start, l.durationMin)}</span> {theme.services.find((s) => s.id === l.serviceId)?.name}
                <span className="block text-muted-foreground">
                  {staff.find((p) => p.id === l.practitionerId)?.name ?? "—"}{l.noPreference ? " (sans préférence)" : ""} · {rooms.find((r) => r.id === l.roomId)?.name ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </Row>
        <Row k="Acompte (FICTIF)">
          {formatPrice(reservation.depositAmount)} · {status === "pending_deposit" ? "en attente" : status === "cancelled" ? "—" : "reçu"}
          {status === "pending_deposit" && reservation.holdExpiresAt != null && <HoldInfo expiresAt={reservation.holdExpiresAt} />}
        </Row>
        {reservation.reminderSentAt != null && <Row k="Rappel">Ouvert dans WhatsApp à {hhmm(reservation.reminderSentAt)}</Row>}
      </dl>

      {/* Cycle de vie */}
      <section aria-labelledby="lifecycle-title" className="space-y-3">
        <h3 id="lifecycle-title" className="font-heading text-xl font-medium">Cycle de vie</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TRANSITIONS[status].map((to) => {
            const check = checkTransition(reservation, to, today);
            return (
              <li key={to}>
                <Button variant={to === "cancelled" ? "danger" : to === "confirmed" ? "primary" : "outline"} size="sm" className="w-full" disabled={!check.ok} onClick={() => apply(to)} aria-describedby={check.ok ? undefined : `why-${to}`}>
                  {transitionLabel(status, to)}
                </Button>
                {!check.ok && (
                  <p id={`why-${to}`} className="mt-1 text-xs text-muted-foreground">
                    {check.reason}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <div aria-live="polite">
          {message && (
            <div className={cn("rounded-xl border px-4 py-3 text-sm", message.tone === "ok" ? "border-success/40 bg-success/10 text-success" : "border-destructive/40 bg-destructive/5 text-destructive")}>
              <p className="flex gap-2">
                {message.tone === "error" && <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />} {message.text}
              </p>
              {message.conflicts && <ConflictList conflicts={message.conflicts} />}
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" onClick={() => setMoving((m) => !m)} aria-expanded={moving}>
          <ArrowRightLeft /> Déplacer
        </Button>
        {canRemind && (
          <Button asChild variant="whatsapp">
            <a href={reminderLink(reservation, rctx)} target="_blank" rel="noopener noreferrer" onClick={() => markReminderSent(reservation.id)}>
              <MessageCircle /> Envoyer un rappel WhatsApp
            </a>
          </Button>
        )}
      </div>
      {canRemind && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {tomorrow ? "Rendez-vous demain : c'est le moment d'envoyer le rappel J-1." : "Message modèle J-1 pré-rempli ; vous l'envoyez vous-même depuis WhatsApp."}
          {reservation.fictive && " Numéro fictif de démonstration."}
        </p>
      )}

      {moving && <MoveForm reservation={reservation} onDone={(text) => { setMoving(false); setMessage({ tone: "ok", text }); }} />}
    </>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 px-4 py-3 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function HoldInfo({ expiresAt }: { expiresAt: number }) {
  const now = useNow(1000);
  if (now === 0) return null;
  const left = remainingMs(expiresAt, now);
  return (
    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="size-3.5" aria-hidden /> Expire dans <strong className="tabular-nums text-foreground">{formatCountdown(left)}</strong> (délai FICTIF)
    </span>
  );
}

export function ConflictList({ conflicts }: { conflicts: Conflict[] }) {
  return (
    <ul className="mt-2 space-y-1">
      {conflicts.map((c, i) => (
        <li key={i} className={cn("flex gap-2 text-sm", c.blocking ? "text-destructive" : "text-foreground")}>
          <span aria-hidden>{c.blocking ? "⛔" : "⚠️"}</span>
          <span>
            <span className="sr-only">{c.blocking ? "Conflit bloquant : " : "Avertissement : "}</span>
            {c.message}
            {c.otherReference && <> (réservation {c.otherReference})</>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Déplacement : nouveau jour / heure, praticien et salle par soin ; conflits recalculés à chaque changement. */
function MoveForm({ reservation, onDone }: { reservation: Reservation; onDone: (text: string) => void }) {
  const { today, staff, rooms, planContext, moveReservation } = useMahazaStore();
  const [date, setDate] = useState(reservation.date);
  const [start, setStart] = useState(reservation.lines[0].start);
  const [assign, setAssign] = useState(reservation.lines.map((l) => ({ practitionerId: l.practitionerId, roomId: l.roomId })));
  const [error, setError] = useState<string | null>(null);

  const siteStaff = staff.filter((p) => (p.siteId ?? reservation.siteId) === reservation.siteId);
  const siteRooms = rooms.filter((r) => (r.siteId ?? reservation.siteId) === reservation.siteId);
  const hours = hoursFor(theme.opening, date);
  const times = useMemo(() => {
    if (!hours) return [];
    const out: string[] = [];
    for (let t = timeToMin(hours.open); t < timeToMin(hours.close); t += theme.opening.slotStepMin) out.push(minToTime(t));
    return out;
  }, [hours]);

  const conflicts = useMemo(
    () => findConflicts(planContext(reservation.siteId), date, buildMovedLines(reservation.lines, { date, start, assignments: assign }), reservation.id),
    [planContext, reservation, date, start, assign],
  );
  const blocked = hasBlocking(conflicts) || !hours;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = moveReservation(reservation.id, { date, start, assignments: assign });
    if (!res.ok) return setError(res.reason);
    onDone(`Rendez-vous déplacé au ${formatDateLong(date)} à ${start}.`);
  };

  return (
    <form onSubmit={submit} className="lux-fade space-y-4 rounded-2xl border border-primary/30 bg-secondary/40 p-4" aria-label="Déplacer la réservation">
      <h3 className="font-heading text-xl font-medium">Déplacer la réservation</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="move-date">Jour</FieldLabel>
          <Input id="move-date" type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setError(null); }} required />
        </div>
        <div>
          <FieldLabel htmlFor="move-start">Heure de début</FieldLabel>
          <Select id="move-start" value={start} onChange={(e) => { setStart(e.target.value); setError(null); }} disabled={!hours}>
            {!times.includes(start) && <option value={start}>{start}</option>}
            {times.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
      </div>
      {reservation.lines.map((l, i) => (
        <fieldset key={l.serviceId} className="grid gap-3 rounded-xl bg-card p-3 sm:grid-cols-2">
          <legend className="px-1 text-sm font-medium">{theme.services.find((s) => s.id === l.serviceId)?.name}</legend>
          <div>
            <FieldLabel htmlFor={`move-p-${i}`}>Praticien</FieldLabel>
            <Select id={`move-p-${i}`} value={assign[i].practitionerId} onChange={(e) => setAssign((a) => a.map((x, j) => (j === i ? { ...x, practitionerId: e.target.value } : x)))}>
              {siteStaff.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.active ? "" : " (inactif)"}</option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor={`move-r-${i}`}>Salle</FieldLabel>
            <Select id={`move-r-${i}`} value={assign[i].roomId} onChange={(e) => setAssign((a) => a.map((x, j) => (j === i ? { ...x, roomId: e.target.value } : x)))}>
              {siteRooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.active ? "" : " (inactive)"}</option>
              ))}
            </Select>
          </div>
        </fieldset>
      ))}
      <div aria-live="polite" data-testid="conflicts">
        {!hours && <p className="text-sm text-destructive">Le spa est fermé ce jour-là.</p>}
        {conflicts.length === 0 && hours ? <p className="text-sm text-success">Aucun conflit : créneau libre.</p> : <ConflictList conflicts={conflicts} />}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={blocked}>
        Valider le déplacement
      </Button>
    </form>
  );
}
