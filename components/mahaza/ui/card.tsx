import * as React from "react";
import { cn } from "@/lib/utils";

/** Carte premium : fond blanc, filet fin, ombre douce. `interactive` ajoute un léger relief au survol. */
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-soft",
        interactive && "transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift motion-reduce:hover:translate-y-0",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";
