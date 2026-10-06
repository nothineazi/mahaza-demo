import { Badge } from "@/components/ui/badge";

/** Marque une donnée de démo inventée (praticien, salle, réservation seed…). */
export function FictiveBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={className} title="Donnée fictive de démonstration">
      FICTIF
    </Badge>
  );
}
