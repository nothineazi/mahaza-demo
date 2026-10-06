import { theme } from "@/theme.config";
import { StaffManager } from "@/components/admin/staff-manager";
import { StaffManager as MahazaStaff } from "@/components/mahaza/admin/staff-manager";

export default function StaffPage() {
  return theme.id === "mahaza" ? <MahazaStaff /> : <StaffManager />;
}
