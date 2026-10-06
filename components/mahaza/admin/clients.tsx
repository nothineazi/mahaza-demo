"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, Search, UserRoundX } from "lucide-react";
import { theme } from "@/theme.config";
import type { Client, Reservation } from "@/data/types";
import { useAdminData } from "@/lib/mahaza/store";
import { loyaltyFor } from "@/lib/mahaza/loyalty";
import { reservationEnd } from "@/lib/mahaza/scheduling";
import { phoneKey } from "@/lib/mahaza/phone";
import { formatDateShort } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { FictiveBadge } from "@/components/fictive-badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { FieldLabel, Input, Textarea } from "../ui/field";
import { Pill, StatusPill } from "../ui/pill";
import { Skeleton, LoadingRegion } from "../ui/skeleton";
import { ReservationDialog } from "./reservation-dialog";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const loyalty = (c: Client, history: Reservation[]) => loyaltyFor(c, history.map((r) => r.status), theme.premium!.loyalty);

export function Clients() {
  const { ready, clients, reservations, focusClientId, setFocusClientId } = useAdminData();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(focusClientId);

  useEffect(() => {
    if (focusClientId) setFocusClientId(null);
  }, [focusClientId, setFocusClientId]);

  const byClient = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) map.set(r.clientId, [...(map.get(r.clientId) ?? []), r]);
    return map;
  }, [reservations]);

  const rows = useMemo(() => {
    const q = norm(query.trim());
    const digits = q.replace(/\D/g, "");
    return clients
      .filter((c) => !q || norm(c.name).includes(q) || (digits.length >= 3 && phoneKey(c.phone).includes(digits)))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [clients, query]);

  if (!ready) {
    return (
      <LoadingRegion label="Chargement des clients">
        <Skeleton className="mb-4 h-10 w-48" />
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          <Skeleton className="h-96" />
          <Skeleton className="hidden h-96 lg:block" />
        </div>
      </LoadingRegion>
    );
  }

  const selected = clients.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-4xl font-medium">Clients</h1>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr] lg:items-start">
        <div className={cn("space-y-3", selected && "hidden lg:block")}>
          <div className="relative">
            <label htmlFor="client-q" className="sr-only">Rechercher un client</label>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input id="client-q" type="search" className="pl-11" placeholder="Nom ou téléphone" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {rows.length} client{rows.length > 1 ? "s" : ""} pour ce spa
          </p>
          {rows.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <UserRoundX className="size-7 text-muted-foreground" aria-hidden />
              <p className="font-heading text-xl font-medium">Aucun client trouvé</p>
            </Card>
          ) : (
            <ul className="space-y-2">
              {rows.map((c) => {
                const history = byClient.get(c.id) ?? [];
                const l = loyalty(c, history);
                return (
                  <li key={c.id}>
                    <button type="button" aria-pressed={c.id === selectedId} onClick={() => setSelectedId(c.id)} className="block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Card interactive className={cn("flex items-center justify-between gap-3 p-3.5", c.id === selectedId && "border-primary ring-1 ring-primary")}>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{c.name}</span>
                          <span className="block text-xs text-muted-foreground">{c.phone}</span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <Pill tone="soft">{l.tier.label}</Pill>
                          <span className="text-xs text-muted-foreground">{l.visits} visite{l.visits > 1 ? "s" : ""}</span>
                        </span>
                      </Card>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={cn(!selected && "hidden lg:block")}>
          {selected ? (
            <ClientDetail key={selected.id} client={selected} history={byClient.get(selected.id) ?? []} onBack={() => setSelectedId(null)} />
          ) : (
            <Card className="p-10 text-center">
              <p className="font-heading text-2xl font-medium">Sélectionnez un client</p>
              <p className="mt-1 text-sm text-muted-foreground">Historique, notes et points de fidélité s&apos;affichent ici.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientDetail({ client, history, onBack }: { client: Client; history: Reservation[]; onBack: () => void }) {
  const { saveClientNotes, staff } = useAdminData();
  const [notes, setNotes] = useState(client.notes);
  const [saved, setSaved] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const l = loyalty(client, history);
  const sorted = [...history].sort((a, b) => `${b.date} ${b.lines[0].start}`.localeCompare(`${a.date} ${a.lines[0].start}`));
  const noShows = history.filter((r) => r.status === "no_show").length;
  const cancelled = history.filter((r) => r.status === "cancelled").length;
  const freq = new Map<string, number>();
  for (const r of history) if (r.status !== "cancelled") for (const line of r.lines) freq.set(line.practitionerId, (freq.get(line.practitionerId) ?? 0) + 1);
  const favId = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const fav = staff.find((p) => p.id === favId)?.name;

  const save = () => {
    saveClientNotes(client.id, notes.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-3 lg:hidden" onClick={onBack}>
        <ArrowLeft /> Retour à la liste
      </Button>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-3xl font-medium">{client.name}</h2>
            <p className="text-sm text-muted-foreground">{client.phone}</p>
          </div>
          {client.fictive ? <FictiveBadge /> : <Pill tone="soft">Créé via le parcours web (démo)</Pill>}
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric k="Visites terminées" v={String(l.visits)} />
          <Metric k="No-shows" v={String(noShows)} />
          <Metric k="Annulations" v={String(cancelled)} />
          <Metric k="Praticien habituel" v={fav ?? "—"} />
        </dl>
      </Card>

      <Card className="space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-heading text-2xl font-medium">
            <Award className="size-5 text-primary" aria-hidden /> Fidélité
          </h3>
          <FictiveBadge />
        </div>
        <p className="font-sans text-3xl font-semibold">
          {l.points} <span className="text-base font-normal text-muted-foreground">points · palier {l.tier.label}</span>
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-border" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(l.progress * 100)} aria-label="Progression vers le palier suivant">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${Math.round(l.progress * 100)}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {l.next ? `Encore ${l.toNext} points avant le palier ${l.next.label}.` : "Palier maximal atteint."} Règle FICTIVE : {theme.premium!.loyalty.pointsPerVisit} points par visite terminée (+ bonus {client.bonusPoints}), à confirmer par {theme.name}.
        </p>
      </Card>

      <Card className="space-y-3 p-6">
        <FieldLabel htmlFor={`notes-${client.id}`} className="font-heading text-2xl font-medium">Notes</FieldLabel>
        <Textarea id={`notes-${client.id}`} value={notes} onChange={(e) => { setNotes(e.target.value); setSaved(false); }} onBlur={() => notes.trim() !== client.notes && save()} placeholder="Préférences, allergies, remarques…" maxLength={500} />
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save}>Enregistrer la note</Button>
          <p role="status" className="text-sm text-success">{saved ? "Note enregistrée (en mémoire, démo)." : ""}</p>
        </div>
      </Card>

      <Card className="space-y-3 p-6">
        <h3 className="font-heading text-2xl font-medium">Historique</h3>
        {sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucune réservation pour ce client.</p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setOpenId(r.id)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium"><span className="first-letter:uppercase">{formatDateShort(r.date)}</span> · {r.lines[0].start} – {reservationEnd(r.lines)}</span>
                    <span className="block truncate text-sm text-muted-foreground">{r.lines.map((x) => theme.services.find((s) => s.id === x.serviceId)?.name).join(" + ")}</span>
                  </span>
                  <StatusPill status={r.status} className="shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ReservationDialog reservationId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="mt-0.5 font-sans text-lg font-semibold">{v}</dd>
    </div>
  );
}
