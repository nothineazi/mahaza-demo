"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { theme } from "@/theme.config";
import { useMahazaStore } from "@/lib/mahaza/store";
import { FAILURE_LABELS, planLines } from "@/lib/mahaza/scheduling";
import { timeToMin } from "@/lib/dates";
import { firstSiteId, multiSite } from "@/lib/sites";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { DEPOSIT_FORM_ID, StepDeposit } from "./step-deposit";
import { StepConfirmation } from "./step-confirmation";
import { StepPractitioners } from "./step-practitioners";
import { StepServices } from "./step-services";
import { StepSite } from "./step-site";
import { StepSlot } from "./step-slot";
import { Stepper } from "./stepper";
import { SummaryBar, SummaryPanel, type PrimaryAction } from "./summary";
import { STEP_TITLES, emptyDraft, wantedFromDraft, type Draft, type StepKey } from "./types";

const FLOW: StepKey[] = multiSite
  ? ["site", "services", "practitioners", "slot", "deposit", "confirmation"]
  : ["services", "practitioners", "slot", "deposit", "confirmation"];

const LEADS: Partial<Record<StepKey, string>> = {
  site: "Chaque spa a ses propres praticiens, salles et disponibilités.",
  services: "Composez votre moment : plusieurs soins peuvent s'enchaîner sur un même créneau.",
  slot: "Les soins du panier s'enchaînent à partir de l'heure choisie.",
};

const newDraft = (): Draft => emptyDraft(multiSite ? null : firstSiteId);

export function MahazaBookingWizard() {
  const { today, reservations, staff, rooms, planContext, createReservation } = useMahazaStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const step = FLOW[stepIndex];
  const max = theme.premium!.maxCartItems;

  // Changement d'étape : retour en haut et focus sur le titre (lecteurs d'écran, clavier).
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [stepIndex]);

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const go = (key: StepKey) => {
    setError(null);
    setStepIndex(FLOW.indexOf(key));
  };

  const ctx = useMemo(() => (draft.siteId ? planContext(draft.siteId) : null), [planContext, draft.siteId, reservations, staff, rooms, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const wanted = useMemo(() => wantedFromDraft({ cart: draft.cart, choice: draft.choice }), [draft.cart, draft.choice]);
  const plan = useMemo(
    () => (ctx && draft.date && draft.time && wanted.length > 0 ? planLines(ctx, draft.date, timeToMin(draft.time), wanted) : null),
    [ctx, draft.date, draft.time, wanted],
  );
  const lines = plan?.ok ? plan.lines : null;

  const selectSite = (siteId: string) => {
    // Chaque spa a ses propres praticiens et salles : on repart de zéro sur le créneau.
    patch({ siteId, choice: {}, date: null, time: null });
    go("services");
  };

  const toggleService = (id: string) =>
    setDraft((d) => {
      const inCart = d.cart.includes(id);
      if (!inCart && d.cart.length >= max) return d;
      const { [id]: _removed, ...choice } = d.choice; // eslint-disable-line @typescript-eslint/no-unused-vars
      return { ...d, cart: inCart ? d.cart.filter((x) => x !== id) : [...d.cart, id], choice: inCart ? choice : d.choice, time: null };
    });

  const choosePractitioner = (serviceId: string, practitionerId: string | null) =>
    setDraft((d) => ({ ...d, choice: { ...d.choice, [serviceId]: practitionerId }, time: null }));

  const confirm = () => {
    if (!draft.siteId || !draft.date || !lines) return;
    const res = createReservation({ siteId: draft.siteId, customerName: draft.name.trim(), customerPhone: draft.phone.trim(), date: draft.date, lines });
    if (!res.ok) return setError(res.reason);
    setError(null);
    patch({ reservationId: res.value.id });
    go("confirmation");
  };

  const restart = () => {
    setDraft(newDraft());
    setError(null);
    setStepIndex(0);
  };

  // Un soin sans praticien qualifié dans ce spa bloque l'étape (message dans l'étape).
  const blockedService = draft.cart.some((id) => !staff.some((p) => p.active && (p.siteId ?? firstSiteId) === draft.siteId && p.serviceIds.includes(id)));

  const action: PrimaryAction | null =
    step === "services"
      ? { label: "Continuer", disabled: draft.cart.length === 0, onClick: () => go("practitioners"), hint: "Ajoutez au moins un soin." }
      : step === "practitioners"
        ? { label: "Choisir le créneau", disabled: blockedService, onClick: () => go("slot"), hint: "Un soin n'a aucun praticien dans ce spa." }
        : step === "slot"
          ? { label: "Continuer vers l'acompte", disabled: !lines, onClick: () => go("deposit"), hint: plan && !plan.ok ? FAILURE_LABELS[plan.reason] : "Choisissez un jour et une heure." }
          : step === "deposit"
            ? { label: "Confirmer ma réservation", form: DEPOSIT_FORM_ID }
            : null;

  const showSummary = step === "services" || step === "practitioners" || step === "slot" || step === "deposit";

  return (
    <div className={cn("mx-auto max-w-6xl px-4 pt-8 sm:px-6", showSummary ? "pb-36 lg:pb-16" : "pb-16")}>
      <Stepper flow={FLOW} index={stepIndex} onGo={(i) => go(FLOW[i])} />

      <div className={cn(showSummary && "lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12")}>
        <div key={step} className="lux-fade-up min-w-0">
          <div className="mb-8 space-y-3">
            {stepIndex > 0 && step !== "confirmation" && (
              <Button variant="ghost" size="sm" className="-ml-3" onClick={() => go(FLOW[stepIndex - 1])}>
                <ArrowLeft /> Retour
              </Button>
            )}
            <h1 ref={headingRef} tabIndex={-1} className="font-heading text-4xl font-medium leading-tight outline-none sm:text-5xl">
              {STEP_TITLES[step]}
            </h1>
            {LEADS[step] && <p className="max-w-xl text-muted-foreground">{LEADS[step]}</p>}
          </div>

          {step === "site" && <StepSite draft={draft} onSelect={selectSite} />}
          {step === "services" && <StepServices draft={draft} onToggle={toggleService} max={max} />}
          {step === "practitioners" && <StepPractitioners draft={draft} onChoose={choosePractitioner} />}
          {step === "slot" && ctx && <StepSlot draft={draft} ctx={ctx} lines={lines} onChange={patch} />}
          {step === "deposit" && <StepDeposit draft={draft} onChange={patch} onConfirm={confirm} error={error} onPickAnotherSlot={() => go("slot")} />}
          {step === "confirmation" && <StepConfirmation draft={draft} onUpdate={patch} onRestart={restart} />}
        </div>

        {showSummary && <SummaryPanel draft={draft} lines={lines} action={action} onRemove={step === "services" || step === "practitioners" ? toggleService : undefined} />}
      </div>

      {showSummary && <SummaryBar draft={draft} lines={lines} action={action} onRemove={step === "services" || step === "practitioners" ? toggleService : undefined} />}
    </div>
  );
}
