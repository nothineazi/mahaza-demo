"use client";

import { useId, useMemo, useState } from "react";
import { Check, Clock, Plus, Search } from "lucide-react";
import { theme } from "@/theme.config";
import { cn, formatDuration } from "@/lib/utils";
import { Card } from "../ui/card";
import { Input } from "../ui/field";
import type { Draft } from "./types";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Panier multi-soins : recherche, filtre par catégorie, ajout / retrait d'un soin. */
export function StepServices({ draft, onToggle, max }: { draft: Draft; onToggle: (serviceId: string) => void; max: number }) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const full = draft.cart.length >= max;

  const groups = useMemo(() => {
    const q = norm(query.trim());
    return theme.categories
      .filter((c) => !category || c === category)
      .map((c) => ({ category: c, services: theme.services.filter((s) => s.category === c && (!q || norm(s.name).includes(q) || norm(c).includes(q))) }))
      .filter((g) => g.services.length > 0);
  }, [query, category]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <label htmlFor={`${uid}-q`} className="sr-only">Rechercher un soin</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id={`${uid}-q`} type="search" className="pl-11" placeholder="Rechercher un soin (ex. hammam, cils…)" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div role="group" aria-label="Filtrer par catégorie" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[null, ...theme.categories].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                category === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary",
              )}
            >
              {c ?? "Tous les soins"}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {draft.cart.length === 0 ? `Ajoutez jusqu'à ${max} soins : ils s'enchaîneront sur un même créneau.` : `${draft.cart.length} soin${draft.cart.length > 1 ? "s" : ""} dans votre panier${full ? " (maximum atteint)" : ""}.`}
        </p>
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="font-heading text-2xl font-medium">Aucun soin trouvé</p>
          <p className="mt-1 text-sm text-muted-foreground">Essayez un autre mot-clé ou une autre catégorie.</p>
        </Card>
      ) : (
        groups.map((g) => (
          <section key={g.category} aria-labelledby={`${uid}-${g.category}`}>
            <h2 id={`${uid}-${g.category}`} className="font-heading text-2xl font-medium">{g.category}</h2>
            <ul className="mt-3 space-y-2">
              {g.services.map((s) => {
                const inCart = draft.cart.includes(s.id);
                const blocked = full && !inCart;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      aria-pressed={inCart}
                      disabled={blocked}
                      onClick={() => onToggle(s.id)}
                      className={cn(
                        "group flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-3 text-left transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                        inCart ? "border-primary bg-secondary/50 shadow-soft" : "border-border enabled:hover:border-primary/60 enabled:hover:shadow-soft",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block font-medium leading-snug">{s.name}</span>
                        {s.description && <span className="mt-0.5 block text-sm text-muted-foreground">{s.description}</span>}
                        {s.durationMin != null && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3.5" aria-hidden /> {formatDuration(s.durationMin)}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors duration-200",
                          inCart ? "border-primary bg-primary text-primary-foreground" : "border-border group-enabled:group-hover:border-primary group-enabled:group-hover:text-primary",
                        )}
                      >
                        {inCart ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                        {inCart ? "Ajouté" : "Ajouter"}
                        <span className="sr-only"> {s.name}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
