"use client";

import { useMemo, useState } from "react";
import { theme } from "@/theme.config";
import { useStore } from "@/lib/store";
import { endTime, formatDateShort } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Filter = "all" | "received" | "pending";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "pending", label: "Acompte en attente" },
  { id: "received", label: "Acompte reçu" },
];

export function ReservationsList() {
  const { ready, bookings, staff, rooms, setDepositReceived } = useStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings
      .filter((b) => (filter === "all" ? true : filter === "received" ? b.depositReceived : !b.depositReceived))
      .filter((b) => !q || b.customerName.toLowerCase().includes(q) || b.reference.toLowerCase().includes(q))
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  }, [bookings, filter, query]);

  if (!ready) return <p className="text-sm text-muted-foreground">Chargement des réservations…</p>;

  const received = bookings.filter((b) => b.depositReceived);
  const totalReceived = received.reduce((sum, b) => sum + b.depositAmount, 0);

  return (
    <div className="space-y-4">
      <h1 className="font-heading text-xl font-bold">Réservations</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Réservations" value={String(bookings.length)} />
        <Stat label="Acomptes reçus" value={`${received.length} / ${bookings.length}`} />
        <Stat label="Montant encaissé" value={formatPrice(totalReceived)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="group" aria-label="Filtrer par statut" className="inline-flex flex-wrap gap-1 rounded-md border border-border p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Input className="sm:max-w-64" type="search" placeholder="Rechercher un client ou une réf." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Rechercher" />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">Aucune réservation ne correspond.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((b) => {
            const service = theme.services.find((s) => s.id === b.serviceId);
            return (
              <li key={b.id}>
                <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{b.customerName}</span>
                      <Badge variant="outline">{b.reference}</Badge>
                      <Badge variant={b.depositReceived ? "success" : "warning"}>{b.depositReceived ? "Acompte reçu" : "En attente"}</Badge>
                    </div>
                    <p className="text-sm">
                      {service?.name} · {staff.find((p) => p.id === b.practitionerId)?.name ?? "—"} · {rooms.find((r) => r.id === b.roomId)?.name ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="inline-block first-letter:uppercase">{formatDateShort(b.date)}</span>, {b.start} – {endTime(b.start, b.durationMin)} · {b.customerPhone}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <span className="text-sm text-muted-foreground">Acompte {formatPrice(b.depositAmount)}</span>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`dep-${b.id}`} className="text-sm">Reçu</Label>
                      <Switch id={`dep-${b.id}`} checked={b.depositReceived} onCheckedChange={(v) => setDepositReceived(b.id, v)} />
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 sm:p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-base font-bold sm:text-xl">{value}</p>
    </Card>
  );
}
