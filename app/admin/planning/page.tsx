import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { theme } from "@/theme.config";
import { Planning } from "@/components/mahaza/admin/planning";

export const metadata: Metadata = { title: "Planning" };

export default function AdminPlanningPage() {
  // Écran propre au thème Mahaza ; absent du thème St Louis.
  if (theme.id !== "mahaza") notFound();
  return <Planning />;
}
