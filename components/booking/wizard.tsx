"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { theme } from "@/theme.config";
import { useStore } from "@/lib/store";
import { depositFor } from "@/lib/availability";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StepService } from "./step-service";
import { StepPractitioner } from "./step-practitioner";
import { StepSlot } from "./step-slot";
import { StepDeposit } from "./step-deposit";
import { StepConfirmation } from "./step-confirmation";
import { STEPS, emptyDraft, type Draft } from "./types";

const TITLES = [
  "Choisissez votre service",
  "Choisissez votre praticien",
  "Choisissez votre créneau",
  "Acompte & coordonnées",
  "Votre réservation",
];

export function BookingWizard() {
  const { addBooking } = useStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const selectService = (serviceId: string) => {
    // Un changement de service invalide le reste du parcours.
    patch({ serviceId, practitionerId: null, roomId: null, date: null, time: null });
    setStep(1);
  };

  const selectPractitioner = (practitionerId: string) => {
    patch({ practitionerId, time: null });
    setStep(2);
  };

  const confirm = () => {
    const service = theme.services.find((s) => s.id === draft.serviceId);
    if (!service || !draft.practitionerId || !draft.roomId || !draft.date || !draft.time) return;
    const booking = addBooking({
      serviceId: service.id,
      practitionerId: draft.practitionerId,
      roomId: draft.roomId,
      date: draft.date,
      start: draft.time,
      durationMin: service.durationMin,
      price: service.price,
      customerName: draft.name.trim(),
      customerPhone: draft.phone.trim(),
      depositAmount: depositFor(service.price, theme.depositPercent),
    });
    patch({ booking });
    setStep(4);
  };

  const restart = () => {
    setDraft(emptyDraft);
    setStep(0);
  };

  const canContinueSlot = Boolean(draft.date && draft.roomId && draft.time);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <ol className="mb-6 flex items-center justify-between gap-1" aria-label="Étapes de la réservation">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col items-center gap-1" aria-current={i === step ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                i < step && "border-primary bg-primary text-primary-foreground",
                i === step && "border-primary text-primary ring-2 ring-primary/30",
                i > step && "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("hidden text-[11px] sm:block", i === step ? "font-medium" : "text-muted-foreground")}>{label}</span>
          </li>
        ))}
      </ol>

      <div className="mb-4 flex items-center gap-2">
        {step > 0 && step < 4 && (
          <Button type="button" variant="ghost" size="icon" onClick={() => setStep(step - 1)} aria-label="Étape précédente">
            <ArrowLeft />
          </Button>
        )}
        <div>
          <p className="text-xs text-muted-foreground sm:hidden">
            Étape {step + 1} sur {STEPS.length}
          </p>
          <h1 className="font-heading text-2xl font-bold">{TITLES[step]}</h1>
        </div>
      </div>

      {step === 0 && <StepService draft={draft} onSelect={selectService} />}
      {step === 1 && <StepPractitioner draft={draft} onSelect={selectPractitioner} />}
      {step === 2 && (
        <>
          <StepSlot draft={draft} onChange={patch} />
          <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
            <Button size="lg" className="w-full" disabled={!canContinueSlot} onClick={() => setStep(3)}>
              Continuer vers l&apos;acompte
            </Button>
          </div>
        </>
      )}
      {step === 3 && <StepDeposit draft={draft} onChange={patch} onConfirm={confirm} />}
      {step === 4 && <StepConfirmation draft={draft} onRestart={restart} />}
    </div>
  );
}
