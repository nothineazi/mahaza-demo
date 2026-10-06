import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingWizard } from "@/components/booking/wizard";

export const metadata: Metadata = { title: "Réserver" };

export default function ReserverPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70dvh]">
        <BookingWizard />
      </main>
      <SiteFooter />
    </>
  );
}
