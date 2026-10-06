import { theme } from "@/theme.config";
import type { Booking, Practitioner, Room, Site } from "@/data/types";
import { multiSite, serviceDuration } from "@/lib/sites";
import { endTime, formatDateLong } from "@/lib/dates";
import { formatDuration, formatPrice } from "@/lib/utils";

interface Props {
  site?: Site;
  serviceId: string;
  practitioner?: Practitioner;
  room?: Room;
  date: string;
  time: string;
  deposit: number;
  booking?: Booking | null;
}

export function BookingSummary({ site, serviceId, practitioner, room, date, time, deposit, booking }: Props) {
  const service = theme.services.find((s) => s.id === serviceId);
  if (!service) return null;

  const duration = serviceDuration(service);
  const rows: [string, string][] = [
    ...(multiSite && site ? ([["Spa", site.name]] as [string, string][]) : []),
    ["Service", service.durationMin != null ? `${service.name} (${formatDuration(service.durationMin)})` : service.name],
    ["Praticien", practitioner?.name ?? "—"],
    ["Salle", room?.name ?? "—"],
    ["Date", formatDateLong(date)],
    ["Heure", `${time} – ${endTime(time, duration)}${service.durationMin == null ? " (créneau indicatif)" : ""}`],
    ...(service.price != null ? ([["Prix", formatPrice(service.price)]] as [string, string][]) : []),
    ["Acompte", formatPrice(deposit)],
  ];
  if (booking) rows.unshift(["Référence", booking.reference]);

  return (
    <dl className="divide-y divide-border rounded-lg border border-border bg-card text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
