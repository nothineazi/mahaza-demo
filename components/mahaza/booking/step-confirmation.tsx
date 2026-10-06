"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, CheckCircle2, Clock, Hourglass, MessageCircle, Pencil, RotateCcw, XCircle } from "lucide-react";
import { theme } from "@/theme.config";
import { useMahazaStore } from "@/lib/mahaza/store";
import { buildIcs } from "@/lib/mahaza/ics";
import { downloadText } from "@/lib/mahaza/download";
import { confirmationMessage } from "@/lib/mahaza/messages";
import { reservationEnd } from "@/lib/mahaza/scheduling";
import { formatDateLong, endTime } from "@/lib/dates";
import { getSite, multiSite } from "@/lib/sites";
import { whatsappLink } from "@/lib/whatsapp";
import { formatPrice } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { StatusPill } from "../ui/pill";
import { DepositCountdown } from "./countdown";
import { CancelDialog, ModifyDialog } from "./manage-dialogs";
import type { Draft } from "./types";

export function StepConfirmation({ draft, onUpdate, onRestart }: { draft: Draft; onUpdate: (patch: Partial<Draft>) => void; onRestart: () => void }) {
  const { reservations, staff, rooms, setStatus } = useMahazaStore();
  const reservation = reservations.find((r) => r.id === draft.reservationId);
  const [modifyOpen, setModifyOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  if (!reservation) return null;

  const site = getSite(reservation.siteId);
  const status = reservation.status;
  const expired = status === "cancelled" && !draft.userCancelled;
  const active = status === "pending_deposit" || status === "confirmed";
  const message = confirmationMessage(reservation, { brand: theme.name, siteName: multiSite ? site.name : null, momoNumber: theme.momo.merchantNumber, services: theme.services, staff, rooms });

  const downloadIcs = () =>
    downloadText(`mahaza-${reservation.reference}.ics`, buildIcs(reservation, { siteName: site.name, brand: theme.name, services: theme.services, staff, rooms, now: new Date() }), "text/calendar;charset=utf-8");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Bandeau d'état */}
      <div className="lux-pop flex flex-col items-center gap-3 rounded-3xl bg-secondary p-8 text-center text-secondary-foreground" role="status" aria-live="polite">
        {status === "confirmed" ? (
          <CheckCircle2 className="size-12 text-success" aria-hidden />
        ) : status === "pending_deposit" ? (
          <Hourglass className="size-12 text-primary" aria-hidden />
        ) : (
          <XCircle className="size-12 text-destructive" aria-hidden />
        )}
        <h2 className="font-heading text-4xl font-medium">
          {status === "confirmed" ? "Rendez-vous confirmé" : status === "pending_deposit" ? "Réservation enregistrée" : expired ? "Réservation expirée" : "Rendez-vous annulé"}
        </h2>
        <p className="max-w-lg text-sm">
          {status === "confirmed" && `Merci ${reservation.customerName.split(" ")[0]} ! ${theme.name} a bien reçu votre acompte : votre rendez-vous est confirmé.`}
          {status === "pending_deposit" && `Merci ${reservation.customerName.split(" ")[0]} ! Votre rendez-vous sera définitivement confirmé dès que ${theme.name} aura vérifié la réception de votre acompte.`}
          {expired && "L'acompte n'a pas été reçu dans le délai imparti : le créneau a été libéré. Vous pouvez réserver à nouveau."}
          {status === "cancelled" && !expired && "Votre rendez-vous a été annulé et le créneau libéré."}
        </p>
      </div>

      {status === "pending_deposit" && <DepositCountdown reservation={reservation} />}

      {notice && (
        <p role="status" className="lux-fade rounded-2xl border border-success/40 bg-success/10 px-5 py-3 text-sm text-success">
          {notice}
        </p>
      )}

      {/* Ticket récapitulatif */}
      <Card className="overflow-hidden">
        <div aria-hidden className="h-1 bg-accent" />
        <div className="space-y-5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Référence</p>
              <p className="font-heading text-3xl font-medium">{reservation.reference}</p>
            </div>
            <StatusPill status={status} />
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {multiSite && (
              <div>
                <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Spa</dt>
                <dd className="mt-1 font-medium">{site.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Date</dt>
              <dd className="mt-1 font-medium first-letter:uppercase">{formatDateLong(reservation.date)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Horaire</dt>
              <dd className="mt-1 font-medium">{reservation.lines[0].start} – {reservationEnd(reservation.lines)} <span className="font-normal text-muted-foreground">(indicatif)</span></dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Acompte (FICTIF)</dt>
              <dd className="mt-1 font-medium">{formatPrice(reservation.depositAmount)}</dd>
            </div>
          </dl>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {reservation.lines.map((l) => (
              <li key={l.serviceId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-sm">
                <span>
                  <span className="block font-medium">{theme.services.find((s) => s.id === l.serviceId)?.name}</span>
                  <span className="block text-muted-foreground">
                    {staff.find((p) => p.id === l.practitionerId)?.name ?? "—"}{l.noPreference ? " (attribué automatiquement)" : ""} · {rooms.find((r) => r.id === l.roomId)?.name ?? "—"}
                  </span>
                </span>
                <span className="font-medium">{l.start} – {endTime(l.start, l.durationMin)}</span>
              </li>
            ))}
          </ul>
          <p className="flex gap-2 text-xs text-muted-foreground">
            <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Praticiens, salles et acompte : données FICTIVES de démonstration. Durées à confirmer par {theme.name}.
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        {active && (
          <>
            <Button asChild variant="whatsapp" size="lg" className="w-full">
              <a href={whatsappLink(theme.whatsappNumber, message)} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Envoyer la confirmation sur WhatsApp
              </a>
            </Button>
            <p className="text-center text-xs text-muted-foreground">Le message est pré-rempli avec votre réservation ; il vous reste à l&apos;envoyer.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" onClick={downloadIcs}>
                <CalendarPlus /> Ajouter au calendrier
              </Button>
              <Button variant="outline" onClick={() => setModifyOpen(true)}>
                <Pencil /> Modifier
              </Button>
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <XCircle /> Annuler
              </Button>
            </div>
          </>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant={active ? "ghost" : "primary"} onClick={onRestart}>
            <RotateCcw /> {active ? "Nouvelle réservation" : "Réserver à nouveau"}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>

      {status === "pending_deposit" && (
        <div className="rounded-2xl border border-dashed border-border p-5 text-sm">
          <p className="font-medium">Outil de démonstration</p>
          <p className="mt-1 text-muted-foreground">Dans la réalité, le spa confirme après vérification de l&apos;acompte. Simulez cette étape pour voir l&apos;état « confirmé ».</p>
          <Button variant="soft" size="sm" className="mt-3" onClick={() => setStatus(reservation.id, "confirmed")}>
            Simuler la confirmation du salon
          </Button>
        </div>
      )}

      <ModifyDialog reservation={reservation} open={modifyOpen} onOpenChange={setModifyOpen} onDone={setNotice} />
      <CancelDialog
        reservation={reservation}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onDone={() => {
          onUpdate({ userCancelled: true });
          setNotice(null);
        }}
      />
    </div>
  );
}
