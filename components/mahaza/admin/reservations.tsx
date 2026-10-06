"use client";

import { useMemo, useState } from "react";
import { Download, Search, SearchX } from "lucide-react";
import { theme } from "@/theme.config";
import type { BookingStatus } from "@/data/types";
import { useAdminData } from "@/lib/mahaza/store";
import { reservationsToCsv } from "@/lib/mahaza/csv";
import { downloadText } from "@/lib/mahaza/download";
import { reservationEnd } from "@/lib/mahaza/scheduling";
import { STATUS_LABELS, STATUS_ORDER, isDepositReceived } from "@/lib/mahaza/status";
import { formatDateShort } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { FieldLabel, Input, Select } from "../ui/field";
import { Skeleton, LoadingRegion } from "../ui/skeleton";
import { StatusPill } from "../ui/pill";
import { ReservationDialog } from "./reservation-dialog";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ReservationsList() {
  const { ready, reservations, staff, site } = useAdminData();
  const [query, setQuery] = useState("");
  const [statuses, setStatuses] = useState<BookingStatus[]>([]);
  const [practitioner, setPractitioner] = useState("");
  const [service, setService] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [newestFirst, setNewestFirst] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = norm(query.trim());
    return reservations
      .filter((r) => statuses.length === 0 || statuses.includes(r.status))
      .filter((r) => !practitioner || r.lines.some((l) => l.practitionerId === practitioner))
      .filter((r) => !service || r.lines.some((l) => l.serviceId === service))
      .filter((r) => (!from || r.date >= from) && (!to || r.date <= to))
      .filter((r) => !q || norm(r.customerName).includes(q) || norm(r.reference).includes(q) || r.customerPhone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "\u0000"))
      .sort((a, b) => {
        const k = `${a.date} ${a.lines[0].start}`.localeCompare(`${b.date} ${b.lines[0].start}`);
        return newestFirst ? -k : k;
      });
  }, [reservations, query, statuses, practitioner, service, from, to, newestFirst]);

  if (!ready) {
    return (
      <LoadingRegion label="Chargement des réservations">
        <Skeleton className="mb-6 h-10 w-56" />
        <Skeleton className="mb-4 h-28" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="mb-2 h-24" />
        ))}
      </LoadingRegion>
    );
  }

  const filtered = Boolean(query || statuses.length || practitioner || service || from || to);
  const count = (s: BookingStatus) => reservations.filter((r) => r.status === s).length;
  const received = reservations.filter((r) => isDepositReceived(r.status));
  const total = received.reduce((sum, r) => sum + r.depositAmount, 0);

  const exportCsv = () =>
    downloadText(`reservations-${site.id}-${new Date().toISOString().slice(0, 10)}.csv`, reservationsToCsv(rows, { siteName: site.name, services: theme.services, staff, rooms: theme.rooms }), "text/csv;charset=utf-8");

  const reset = () => {
    setQuery("");
    setStatuses([]);
    setPractitioner("");
    setService("");
    setFrom("");
    setTo("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl font-medium">Réservations</h1>
          <p className="mt-1 text-sm text-muted-foreground">{site.name}</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download /> Exporter en CSV ({rows.length} ligne{rows.length > 1 ? "s" : ""})
        </Button>
      </div>

      <section aria-label="Synthèse" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Réservations" value={String(reservations.length)} />
        <Stat label="En attente d'acompte" value={String(count("pending_deposit"))} />
        <Stat label="Confirmées" value={String(count("confirmed"))} />
        <Stat label="Acomptes encaissés (FICTIF)" value={formatPrice(total)} />
      </section>

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="relative">
          <label htmlFor="res-q" className="sr-only">Rechercher un client, un téléphone ou une référence</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input id="res-q" type="search" className="pl-11" placeholder="Rechercher un client, un téléphone ou une référence" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div role="group" aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => {
            const on = statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                aria-pressed={on}
                onClick={() => setStatuses((cur) => (on ? cur.filter((x) => x !== s) : [...cur, s]))}
                className={cn("min-h-10 rounded-full border px-4 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary")}
              >
                {STATUS_LABELS[s]} <span className="opacity-80">({count(s)})</span>
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <FieldLabel htmlFor="res-p">Praticien</FieldLabel>
            <Select id="res-p" value={practitioner} onChange={(e) => setPractitioner(e.target.value)}>
              <option value="">Tous</option>
              {staff.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="res-s">Soin</FieldLabel>
            <Select id="res-s" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">Tous</option>
              {theme.categories.map((c) => (
                <optgroup key={c} label={c}>
                  {theme.services.filter((s) => s.category === c).map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="res-from">Du</FieldLabel>
            <Input id="res-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="res-to">Au</FieldLabel>
            <Input id="res-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p aria-live="polite" className="text-muted-foreground">
            {rows.length} résultat{rows.length > 1 ? "s" : ""}{filtered ? " (filtres actifs)" : ""}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" aria-pressed={newestFirst} onClick={() => setNewestFirst((v) => !v)}>
              {newestFirst ? "Plus récentes d'abord" : "Plus anciennes d'abord"}
            </Button>
            {filtered && (
              <Button variant="soft" size="sm" onClick={reset}>
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-10 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-heading text-2xl font-medium">Aucune réservation ne correspond</p>
          <p className="text-sm text-muted-foreground">Modifiez ou réinitialisez les filtres.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="block w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card interactive className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{r.customerName}</span>
                      <span className="text-xs text-muted-foreground">{r.reference}</span>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="text-sm">
                      {r.lines.map((l) => theme.services.find((s) => s.id === l.serviceId)?.name).join(" + ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="inline-block first-letter:uppercase">{formatDateShort(r.date)}</span>, {r.lines[0].start} – {reservationEnd(r.lines)} · {staffNames(r.lines.map((l) => l.practitionerId), staff)} · {r.customerPhone}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-muted-foreground">Acompte {formatPrice(r.depositAmount)}</p>
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ReservationDialog reservationId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

const staffNames = (ids: string[], staff: { id: string; name: string }[]) => [...new Set(ids)].map((id) => staff.find((p) => p.id === id)?.name ?? "—").join(", ");

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-sans text-xl font-semibold sm:text-2xl">{value}</p>
    </Card>
  );
}
