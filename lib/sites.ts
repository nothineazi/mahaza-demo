import { theme } from "@/theme.config";
import type { Service, Site } from "@/data/types";

/** Site par défaut des marques mono-site (ex. St Louis) : aucune étape « spa » n'est alors affichée. */
const defaultSite: Site = { id: "main", name: theme.name, city: theme.city, address: theme.address };

export const sites: Site[] = theme.sites && theme.sites.length > 0 ? theme.sites : [defaultSite];
export const multiSite = sites.length > 1;

export const firstSiteId = sites[0].id;

/** Un élément sans siteId appartient au premier (donc unique) site. */
export const belongsToSite = (item: { siteId?: string }, siteId: string) => (item.siteId ?? firstSiteId) === siteId;

export const getSite = (siteId: string | null | undefined): Site => sites.find((s) => s.id === siteId) ?? sites[0];

/** Durée utilisée pour les créneaux : celle du service si connue, sinon le défaut (FICTIF) de la démo. */
export const serviceDuration = (service: Pick<Service, "durationMin">): number =>
  service.durationMin ?? theme.defaultDurationMin ?? 60;
