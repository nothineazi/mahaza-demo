import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { theme } from "@/theme.config";
import { Clients } from "@/components/mahaza/admin/clients";

export const metadata: Metadata = { title: "Clients" };

export default function AdminClientsPage() {
  // Écran propre au thème Mahaza ; absent du thème St Louis.
  if (theme.id !== "mahaza") notFound();
  return <Clients />;
}
