import { theme } from "@/theme.config";
import { Planning } from "@/components/admin/planning";
import { Dashboard } from "@/components/mahaza/admin/dashboard";

export default function AdminHomePage() {
  // Mahaza : tableau de bord ; St Louis : planning (inchangé).
  return theme.id === "mahaza" ? <Dashboard /> : <Planning />;
}
