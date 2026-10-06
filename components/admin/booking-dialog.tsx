"use client";

import { theme } from "@/theme.config";
import type { Booking } from "@/data/types";
import { useStore } from "@/lib/store";
import { endTime, formatDateLong } from "@/lib/dates";
import { formatPrice } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Props {
  bookingId: string | null;
  onClose: () => void;
}

export function BookingDialog({ bookingId, onClose }: Props) {
  const { bookings, staff, rooms, setDepositReceived } = useStore();
  const booking: Booking | undefined = bookings.find((b) => b.id === bookingId);
  const service = theme.services.find((s) => s.id === booking?.serviceId);

  return (
    <Dialog open={Boolean(booking)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {booking && (
          <>
            <DialogHeader>
              <DialogTitle>{service?.name}</DialogTitle>
              <DialogDescription>Réf. {booking.reference}</DialogDescription>
            </DialogHeader>
            <dl className="divide-y divide-border rounded-md border border-border text-sm">
              {[
                ["Client", `${booking.customerName} · ${booking.customerPhone}`],
                ["Quand", `${formatDateLong(booking.date)}, ${booking.start} – ${endTime(booking.start, booking.durationMin)}`],
                ["Praticien", staff.find((p) => p.id === booking.practitionerId)?.name ?? "—"],
                ["Salle", rooms.find((r) => r.id === booking.roomId)?.name ?? "—"],
                ...(booking.price != null ? [["Prix", formatPrice(booking.price)]] : []),
                ["Acompte demandé", formatPrice(booking.depositAmount)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-3 py-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted p-3">
              <Label htmlFor="deposit-switch">Acompte reçu</Label>
              <Switch
                id="deposit-switch"
                checked={booking.depositReceived}
                onCheckedChange={(checked) => setDepositReceived(booking.id, checked)}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
