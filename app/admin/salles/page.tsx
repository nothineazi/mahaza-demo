import { theme } from "@/theme.config";
import { RoomsManager } from "@/components/admin/rooms-manager";
import { RoomsManager as MahazaRooms } from "@/components/mahaza/admin/rooms-manager";

export default function SallesPage() {
  return theme.id === "mahaza" ? <MahazaRooms /> : <RoomsManager />;
}
