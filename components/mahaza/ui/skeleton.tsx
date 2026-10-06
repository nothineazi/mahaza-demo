import { cn } from "@/lib/utils";

/** Bloc de chargement : mêmes dimensions que le contenu final (aucun décalage de mise en page). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("lux-skeleton rounded-xl bg-muted", className)} />;
}

/** Zone de chargement annoncée une seule fois aux lecteurs d'écran. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
