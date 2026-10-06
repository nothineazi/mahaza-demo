"use client";

import { useId, useState } from "react";
import { AlertTriangle, Check, Clock, Copy, Info } from "lucide-react";
import { theme } from "@/theme.config";
import { depositForService } from "@/lib/availability";
import { holdMinutesFor } from "@/lib/mahaza/holds";
import { useMahazaStore } from "@/lib/mahaza/store";
import { phoneDigits } from "@/lib/mahaza/phone";
import { getSite } from "@/lib/sites";
import { formatPrice } from "@/lib/utils";
import { Button } from "../ui/button";
import { FieldError, FieldLabel, Input } from "../ui/field";
import type { Draft } from "./types";

export const DEPOSIT_FORM_ID = "deposit-form";

interface Props {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onConfirm: () => void;
  /** Erreur renvoyée par le store (ex. créneau pris entre-temps). */
  error: string | null;
  onPickAnotherSlot: () => void;
}

export function StepDeposit({ draft, onChange, onConfirm, error, onPickAnotherSlot }: Props) {
  const { nextReference } = useMahazaStore();
  const uid = useId();
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  const site = getSite(draft.siteId);
  const deposit = depositForService({}, site, theme.depositPercent);
  const holdMin = holdMinutesFor(site, theme.premium!);
  const nameOk = draft.name.trim().length >= 2;
  const phoneOk = phoneDigits(draft.phone).length >= 8;

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
    <form id={DEPOSIT_FORM_ID} onSubmit={submit} noValidate className="space-y-10">
      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-destructive/50 bg-destructive/5 p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
          </p>
          <Button variant="outline" size="sm" onClick={onPickAnotherSlot}>
            Choisir un autre créneau
          </Button>
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-primary/40 bg-secondary p-6 text-secondary-foreground">
        <h2 className="font-heading text-2xl font-medium">Réglez l&apos;acompte par Mobile Money</h2>
        <p className="text-sm">
          Envoyez <strong>{formatPrice(deposit)}</strong> (acompte forfaitaire par réservation, montant FICTIF de démonstration) au numéro marchand ci-dessous.
        </p>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 text-card-foreground">
          <div>
            <p className="text-xs text-muted-foreground">Numéro marchand MoMo (placeholder)</p>
            <p className="text-xl font-bold tracking-wide">{theme.momo.merchantNumber}</p>
            <p className="text-xs text-muted-foreground">{theme.momo.merchantName}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyNumber}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copié" : "Copier"}
          </Button>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Ouvrez MTN MoMo ou Orange Money sur votre téléphone.</li>
          <li>Choisissez « Transfert d&apos;argent » (ou « Paiement marchand »).</li>
          <li>
            Saisissez le numéro {theme.momo.merchantNumber} et le montant {formatPrice(deposit)}.
          </li>
          <li>
            Dans le motif, indiquez la référence <strong>{nextReference}</strong>.
          </li>
          <li>Validez avec votre code secret, puis confirmez ci-dessous.</li>
        </ol>
        <p className="flex gap-2 rounded-xl bg-card/70 p-3 text-xs text-card-foreground">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
          Votre créneau est réservé pendant {holdMin} minutes (délai FICTIF, configurable) : sans réception de l&apos;acompte, il est libéré automatiquement.
        </p>
        <p className="flex gap-2 rounded-xl bg-card/70 p-3 text-xs text-card-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Démo : aucun paiement réel n&apos;est effectué sur ce site. Le spa vérifie la réception de l&apos;acompte manuellement.
        </p>
      </section>

      <section className="space-y-5">
        <h2 className="font-heading text-2xl font-medium">Vos coordonnées</h2>
        <div>
          <FieldLabel htmlFor={`${uid}-name`}>Nom complet</FieldLabel>
          <Input id={`${uid}-name`} autoComplete="name" value={draft.name} onChange={(e) => onChange({ name: e.target.value })} aria-invalid={touched && !nameOk} aria-describedby={`${uid}-name-err`} />
          <FieldError id={`${uid}-name-err`}>{touched && !nameOk ? "Indiquez votre nom." : null}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor={`${uid}-phone`}>Téléphone (WhatsApp de préférence)</FieldLabel>
          <Input
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="6 XX XX XX XX"
            value={draft.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            aria-invalid={touched && !phoneOk}
            aria-describedby={`${uid}-phone-err`}
          />
          <FieldError id={`${uid}-phone-err`}>{touched && !phoneOk ? "Indiquez un numéro valide (8 chiffres minimum)." : null}</FieldError>
        </div>
      </section>
    </form>
  );
}
