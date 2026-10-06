"use client";

import { useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import { theme } from "@/theme.config";
import { useStore } from "@/lib/store";
import { depositForService } from "@/lib/availability";
import { getSite } from "@/lib/sites";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingSummary } from "./summary";
import type { Draft } from "./types";

interface Props {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onConfirm: () => void;
}

export function StepDeposit({ draft, onChange, onConfirm }: Props) {
  const { staff, rooms, nextReference } = useStore();
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  const service = theme.services.find((s) => s.id === draft.serviceId);
  if (!service || !draft.date || !draft.time) return null;

  const site = getSite(draft.siteId);
  const flatDeposit = site.depositAmount != null;
  const deposit = depositForService(service, site, theme.depositPercent);
  const nameOk = draft.name.trim().length >= 2;
  const phoneOk = draft.phone.replace(/\D/g, "").length >= 8;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(theme.momo.merchantNumber.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : le numéro reste affiché à l'écran */
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameOk && phoneOk) onConfirm();
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <BookingSummary
        site={site}
        serviceId={service.id}
        practitioner={staff.find((p) => p.id === draft.practitionerId)}
        room={rooms.find((r) => r.id === draft.roomId)}
        date={draft.date}
        time={draft.time}
        deposit={deposit}
      />

      <section className="space-y-3 rounded-lg border border-primary/40 bg-secondary p-4 text-secondary-foreground">
        <h3 className="font-heading text-lg font-semibold">Payez l&apos;acompte par Mobile Money</h3>
        <p className="text-sm">
          Pour confirmer votre rendez-vous, envoyez <strong>{formatPrice(deposit)}</strong> ({flatDeposit ? "acompte forfaitaire — montant FICTIF de démonstration" : `${theme.depositPercent} % du prix`}) au numéro marchand ci-dessous.
        </p>
        <div className="flex items-center justify-between gap-3 rounded-md bg-card p-3 text-card-foreground">
          <div>
            <p className="text-xs text-muted-foreground">Numéro marchand MoMo</p>
            <p className="text-xl font-bold tracking-wide">{theme.momo.merchantNumber}</p>
            <p className="text-xs text-muted-foreground">{theme.momo.merchantName}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={copyNumber}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copié" : "Copier"}
          </Button>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Ouvrez MTN MoMo ou Orange Money sur votre téléphone.</li>
          <li>Choisissez « Transfert d&apos;argent » (ou « Paiement marchand »).</li>
          <li>Saisissez le numéro {theme.momo.merchantNumber} et le montant {formatPrice(deposit)}.</li>
          <li>
            Dans le motif, indiquez la référence <strong>{nextReference}</strong>.
          </li>
          <li>Validez avec votre code secret, puis revenez ici et confirmez.</li>
        </ol>
        <p className="flex gap-2 rounded-md bg-card/70 p-2 text-xs text-card-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          Démo : aucun paiement réel n&apos;est effectué sur ce site. Le salon vérifie la réception de l&apos;acompte manuellement.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-lg font-semibold">Vos coordonnées</h3>
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" autoComplete="name" value={draft.name} onChange={(e) => onChange({ name: e.target.value })} aria-invalid={touched && !nameOk} />
          {touched && !nameOk && <p className="text-sm text-destructive">Indiquez votre nom.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="6 XX XX XX XX"
            value={draft.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            aria-invalid={touched && !phoneOk}
          />
          {touched && !phoneOk && <p className="text-sm text-destructive">Indiquez un numéro valide (8 chiffres minimum).</p>}
        </div>
      </section>

      <Button type="submit" size="lg" className="w-full">
        J&apos;ai envoyé l&apos;acompte — confirmer
      </Button>
    </form>
  );
}
