import type { Metadata } from "next";
import { theme } from "@/theme.config";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingWizard } from "@/components/booking/wizard";
import { MahazaHeader } from "@/components/mahaza/site-header";
import { MahazaFooter } from "@/components/mahaza/site-footer";
import { MahazaBookingWizard } from "@/components/mahaza/booking/wizard";

export const metadata: Metadata = { title: "Réserver" };

export default function ReserverPage() {
  if (theme.id === "mahaza") {
    return (
      <>
        <MahazaHeader />
        <main id="contenu" className="min-h-[70dvh]">
          <MahazaBookingWizard />
        </main>
        <MahazaFooter />
      </>
    );
  }
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
