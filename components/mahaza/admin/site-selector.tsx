"use client";

import { MapPin } from "lucide-react";
import { useMahazaStore } from "@/lib/mahaza/store";
import { getSite, multiSite, sites } from "@/lib/sites";
import { Select } from "../ui/field";

/** Sélecteur de spa du back-office : filtre tableau de bord, planning, réservations, clients, salles et staff. */
export function AdminSiteSelector() {
  const { adminSiteId, setAdminSiteId } = useMahazaStore();
  if (!multiSite) return null;
  return (
    <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center sm:gap-4 sm:px-4">
      <label htmlFor="admin-site" className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
        <MapPin className="size-4 text-primary" aria-hidden /> Spa
      </label>
      <Select id="admin-site" value={adminSiteId} onChange={(e) => setAdminSiteId(e.target.value)} className="sm:max-w-xs">
        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <p className="text-xs text-muted-foreground">{getSite(adminSiteId).address}</p>
    </div>
  );
}
