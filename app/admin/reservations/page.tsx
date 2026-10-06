import { theme } from "@/theme.config";
import { ReservationsList } from "@/components/admin/reservations-list";
import { ReservationsList as MahazaReservations } from "@/components/mahaza/admin/reservations";

export default function ReservationsPage() {
  return theme.id === "mahaza" ? <MahazaReservations /> : <ReservationsList />;
}
