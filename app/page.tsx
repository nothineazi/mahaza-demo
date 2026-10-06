import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { theme } from "@/theme.config";
import { formatDuration, formatPrice } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const activeStaff = theme.practitioners.filter((p) => p.active);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-secondary">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 px-4 py-14 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{theme.tagline} · {theme.city}</p>
            <h1 className="font-heading text-4xl font-bold leading-tight text-secondary-foreground sm:text-5xl">
              {theme.name}
              <span className="block text-2xl font-normal text-foreground/80 sm:text-3xl">Réservez en ligne, en 2 minutes.</span>
            </h1>
            <p className="max-w-xl text-base text-foreground/80">{theme.description}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{theme.address}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="size-4" />{theme.hoursLabel}</span>
            </div>
            <Button asChild size="lg">
              <Link href="/reserver">Prendre rendez-vous</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="font-heading text-2xl font-bold">Nos services</h2>
          {theme.categories.map((category) => (
            <div key={category} className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">{category}</h3>
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-card">
                {theme.services
                  .filter((s) => s.category === category)
                  .map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-4 p-4">
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-sm text-muted-foreground">{s.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDuration(s.durationMin)}</p>
                      </div>
                      <p className="shrink-0 font-semibold text-primary">{formatPrice(s.price)}</p>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-14">
          <h2 className="font-heading text-2xl font-bold">L&apos;équipe</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {activeStaff.map((p) => (
              <Card key={p.id}>
                <CardHeader className="p-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-secondary font-heading text-lg font-bold text-secondary-foreground">
                    {p.name.charAt(0)}
                  </div>
                  <CardTitle className="mt-2 text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground">{p.role}</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
