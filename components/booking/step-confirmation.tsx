"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { theme } from "@/theme.config";
import { useStore } from "@/lib/store";
import { endTime, formatDateLong } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { getSite, multiSite } from "@/lib/sites";
import { whatsappButtonClass, whatsappLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { BookingSummary } from "./summary";
import type { Draft } from "./types";

export function StepConfirmation({ draft, onRestart }: { draft: Draft; onRestart: () => void }) {
  const { staff, rooms } = useStore();
  const booking = draft.booking;
  if (!booking) return null;

  const service = theme.services.find((s) => s.id === booking.serviceId);
  const practitioner = staff.find((p) => p.id === booking.practitionerId);
  const room = rooms.find((r) => r.id === booking.roomId);
  const site = getSite(booking.siteId);

  const message = [
    `Bonjour ${theme.name}${multiSite ? ` (${site.name})` : ""}, c'est ${booking.customerName}.`,
    `Je viens de réserver : ${service?.name} avec ${practitioner?.name} (${room?.name}),`,
    `le ${formatDateLong(booking.date)} de ${booking.start} à ${endTime(booking.start, booking.durationMin)}.`,
    `Référence : ${booking.reference}.`,
    `J'ai envoyé l'acompte de ${formatPrice(booking.depositAmount)} par Mobile Money au ${theme.momo.merchantNumber}.`,
    "Pouvez-vous me confirmer la réception ? Merci !",
  ].join("\n");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-2 rounded-lg bg-secondary p-6 text-center text-secondary-foreground">
        <CheckCircle2 className="size-12 text-success" aria-hidden />
        <h2 className="font-heading text-2xl font-bold">Réservation enregistrée</h2>
        <p className="text-sm">
          Merci {booking.customerName.split(" ")[0]} ! Votre rendez-vous sera définitivement confirmé dès que {theme.name} aura vérifié la réception de votre acompte.
        </p>
      </div>

      <BookingSummary
        site={site}
        serviceId={booking.serviceId}
        practitioner={practitioner}
        room={room}
        date={booking.date}
        time={booking.start}
        deposit={booking.depositAmount}
        booking={booking}
      />

      <div className="space-y-3">
        <Button asChild variant="whatsapp" size="lg" className={cn("w-full", whatsappButtonClass)}>
          <a href={whatsappLink(theme.whatsappNumber, message)} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
            Envoyer la confirmation sur WhatsApp
          </a>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Le message est pré-rempli avec votre réservation ; il vous reste à l&apos;envoyer.
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onRestart}>
            Nouvelle réservation
          </Button>
          <Button asChild variant="ghost" className="flex-1">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
