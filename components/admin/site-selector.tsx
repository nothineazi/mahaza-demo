"use client";

import { MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import { getSite, multiSite, sites } from "@/lib/sites";

/** Sélecteur de spa du back-office : filtre planning, réservations, salles et staff. Absent pour les marques mono-site. */
export function AdminSiteSelector() {
  const { adminSiteId, setAdminSiteId } = useStore();
  if (!multiSite) return null;

  return (
    <div className="mb-4 flex flex-col gap-1.5 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:gap-3">
      <label htmlFor="admin-site" className="inline-flex items-center gap-1.5 text-sm font-medium">
        <MapPin className="size-4 text-primary" aria-hidden /> Spa
      </label>
      <select
        id="admin-site"
        value={adminSiteId}
        onChange={(e) => setAdminSiteId(e.target.value)}
        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">{getSite(adminSiteId).address}</p>
    </div>
  );
}
