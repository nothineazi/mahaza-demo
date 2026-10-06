"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { theme } from "@/theme.config";
import { useStore } from "@/lib/store";
import { depositForService } from "@/lib/availability";
import { firstSiteId, getSite, multiSite, serviceDuration } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StepSite } from "./step-site";
import { StepService } from "./step-service";
import { StepPractitioner } from "./step-practitioner";
import { StepSlot } from "./step-slot";
import { StepDeposit } from "./step-deposit";
import { StepConfirmation } from "./step-confirmation";
import { STEP_LABELS, STEP_TITLES, emptyDraft, type Draft, type StepKey } from "./types";

/** Parcours : l'étape « spa » n'existe que pour les marques multi-sites. */
const FLOW: StepKey[] = multiSite
  ? ["site", "service", "practitioner", "slot", "deposit", "confirmation"]
  : ["service", "practitioner", "slot", "deposit", "confirmation"];

const newDraft = (): Draft => ({ ...emptyDraft, siteId: multiSite ? null : firstSiteId });

export function BookingWizard() {
  const { addBooking } = useStore();
  const [stepIndex, setStep] = useState(0);
  const step = FLOW[stepIndex];
  const last = FLOW.length - 1;
  const [draft, setDraft] = useState<Draft>(newDraft);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stepIndex]);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const goTo = (key: StepKey) => setStep(FLOW.indexOf(key));

  const selectSite = (siteId: string) => {
    // Chaque spa a ses propres praticiens et salles : on repart de zéro après le service.
    patch({ siteId, practitionerId: null, roomId: null, date: null, time: null });
    goTo("service");
  };

  const selectService = (serviceId: string) => {
    // Un changement de service invalide le reste du parcours.
    patch({ serviceId, practitionerId: null, roomId: null, date: null, time: null });
    goTo("practitioner");
  };

  const selectPractitioner = (practitionerId: string) => {
    patch({ practitionerId, time: null });
    goTo("slot");
  };

  const confirm = () => {
    const service = theme.services.find((s) => s.id === draft.serviceId);
    if (!service || !draft.practitionerId || !draft.roomId || !draft.date || !draft.time) return;
    const booking = addBooking({
      siteId: getSite(draft.siteId).id,
      serviceId: service.id,
      practitionerId: draft.practitionerId,
      roomId: draft.roomId,
      date: draft.date,
      start: draft.time,
      durationMin: serviceDuration(service),
      price: service.price,
      customerName: draft.name.trim(),
      customerPhone: draft.phone.trim(),
      depositAmount: depositForService(service, getSite(draft.siteId), theme.depositPercent),
    });
    patch({ booking });
    goTo("confirmation");
  };

  const restart = () => {
    setDraft(newDraft());
    setStep(0);
  };

  const canContinueSlot = Boolean(draft.date && draft.roomId && draft.time);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <ol className="mb-6 flex items-center justify-between gap-1" aria-label="Étapes de la réservation">
        {FLOW.map((key, i) => {
          const label = STEP_LABELS[key];
          return (
          <li key={key} className="flex flex-1 flex-col items-center gap-1" aria-current={i === stepIndex ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                i < stepIndex && "border-primary bg-primary text-primary-foreground",
                i === stepIndex && "border-primary text-primary ring-2 ring-primary/30",
                i > stepIndex && "border-border text-muted-foreground",
              )}
            >
              {i < stepIndex ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-[11px] sm:block", i === stepIndex ? "font-medium" : "text-muted-foreground")}>{label}</span>
          </li>
          );
        })}
      </ol>

      <div className="mb-4 flex items-center gap-2">
        {stepIndex > 0 && stepIndex < last && (
          <Button type="button" variant="ghost" size="icon" onClick={() => setStep(stepIndex - 1)} aria-label="Étape précédente">
            <ArrowLeft />
          </Button>
        )}
        <div>
          <p className="text-xs text-muted-foreground sm:hidden">
            Étape {stepIndex + 1} sur {FLOW.length}
          </p>
          <h1 className="font-heading text-2xl font-bold">{STEP_TITLES[step]}</h1>
        </div>
      </div>

      {step === "site" && <StepSite draft={draft} onSelect={selectSite} />}
      {step === "service" && <StepService draft={draft} onSelect={selectService} />}
      {step === "practitioner" && <StepPractitioner draft={draft} onSelect={selectPractitioner} />}
      {step === "slot" && (
        <>
          <StepSlot draft={draft} onChange={patch} />
          <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
            <Button size="lg" className="w-full" disabled={!canContinueSlot} onClick={() => goTo("deposit")}>
              Continuer vers l&apos;acompte
            </Button>
          </div>
        </>
      )}
      {step === "deposit" && <StepDeposit draft={draft} onChange={patch} onConfirm={confirm} />}
      {step === "confirmation" && <StepConfirmation draft={draft} onRestart={restart} />}
    </div>
  );
}
