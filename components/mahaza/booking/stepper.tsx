import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_LABELS, type StepKey } from "./types";

/** Barre de progression + étapes. Les étapes déjà franchies sont cliquables (retour en arrière). */
export function Stepper({ flow, index, onGo }: { flow: StepKey[]; index: number; onGo: (i: number) => void }) {
  const done = flow.length - 1;
  const pct = Math.round((Math.min(index, done) / done) * 100);
  const interactive = flow[index] !== "confirmation";
  return (
    <nav aria-label="Progression de la réservation" className="mb-8">
      <p className="mb-3 text-sm text-muted-foreground sm:hidden">
        Étape {index + 1} sur {flow.length} · <span className="font-medium text-foreground">{STEP_LABELS[flow[index]]}</span>
      </p>
      <div className="relative mb-4 h-1 overflow-hidden rounded-full bg-border" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Avancement de la réservation">
        <span className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${pct}%` }} />
      </div>
      <ol className="hidden items-start justify-between gap-2 sm:flex">
        {flow.map((key, i) => {
          const reached = i < index;
          const current = i === index;
          const body = (
            <>
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors duration-300",
                  reached && "border-primary bg-primary text-primary-foreground",
                  current && "border-primary bg-card text-primary ring-4 ring-primary/15",
                  !reached && !current && "border-border bg-card text-muted-foreground",
                )}
              >
                {reached ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("text-xs", current ? "font-semibold text-foreground" : "text-muted-foreground")}>{STEP_LABELS[key]}</span>
            </>
          );
          return (
            <li key={key} className="flex flex-1 justify-center" aria-current={current ? "step" : undefined}>
              {reached && interactive ? (
                <button type="button" onClick={() => onGo(i)} className="flex min-h-11 flex-col items-center gap-1.5 rounded-lg px-2 hover:opacity-80">
                  {body}
                  <span className="sr-only"> (revenir à cette étape)</span>
                </button>
              ) : (
                <div className="flex min-h-11 flex-col items-center gap-1.5 px-2">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
