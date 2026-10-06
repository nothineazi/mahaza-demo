import Image from "next/image";
import Link from "next/link";
import { ClipboardList, Clock, Droplets, Flower2, Hand, Mail, MapPin, Waves, type LucideIcon } from "lucide-react";
import { theme } from "@/theme.config";
import { formatDuration, formatPrice } from "@/lib/utils";
import { sites } from "@/lib/sites";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GiftCards } from "./gift-cards";
import { HeroCarousel } from "./hero-carousel";

const FEATURED_ICONS: LucideIcon[] = [Flower2, Droplets, Waves, Hand];

const hhmm = (t: string) => t.replace(":", "h");

/** Accueil Mahaza : contenu issu du site actuel (voir `theme.home` et le README pour le détail réel / fictif). */
export function MahazaHome() {
  const home = theme.home;
  if (!home) return null;

  return (
    <main>
      <HeroCarousel />

      {/* La magie du bien-être */}
      <section className="relative mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center">
        <Image
          src={home.decorImage.src}
          alt=""
          width={home.decorImage.width}
          height={home.decorImage.height}
          aria-hidden
          className="pointer-events-none absolute -top-2 right-2 -z-10 w-28 opacity-60 sm:w-40"
        />
        <Image
          src={home.about.image.src}
          alt={home.about.image.alt}
          width={home.about.image.width}
          height={home.about.image.height}
          sizes="(min-width: 768px) 480px, 100vw"
          className="h-auto w-full rounded-lg"
        />
        <div className="space-y-4">
          <h2 className="font-heading text-3xl font-bold">{home.about.title}</h2>
          <p className="text-foreground/80">{home.about.text}</p>
          <Button asChild>
            <Link href="/reserver">Réserver un soin</Link>
          </Button>
        </div>
      </section>

      {/* Soins vedettes */}
      <section className="bg-muted/60">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h2 className="font-heading text-2xl font-bold">Nos soins vedettes</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {home.featured.map((f, i) => {
              const Icon = FEATURED_ICONS[i % FEATURED_ICONS.length];
              return (
                <li key={f.title}>
                  <Card className="h-full">
                    <CardHeader className="flex-row items-center gap-3 space-y-0 p-4 pb-2">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <CardTitle className="text-lg">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-muted-foreground">{f.description}</CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Process en 3 étapes */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-heading text-2xl font-bold">Votre parcours en 3 étapes</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {home.process.map((step, i) => (
            <li key={step.title} className="flex flex-col items-center gap-3 text-center">
              {step.image ? (
                <Image
                  src={step.image.src}
                  alt={step.image.alt}
                  width={step.image.width}
                  height={step.image.height}
                  sizes="112px"
                  className="size-28 rounded-full object-cover ring-4 ring-accent"
                />
              ) : (
                // Étape 1 : pas d'image sur le site actuel -> icône.
                <span className="flex size-28 items-center justify-center rounded-full bg-secondary text-secondary-foreground ring-4 ring-accent">
                  <ClipboardList className="size-12" aria-hidden />
                </span>
              )}
              <p className="font-heading text-lg font-semibold">
                <span className="text-primary">{i + 1}.</span> {step.title}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-5xl px-4 pb-14">
        <h2 className="font-heading text-2xl font-bold">Nos services</h2>
        <p className="mt-1 text-sm text-muted-foreground">Tarifs communiqués par le spa : le site actuel n&apos;affiche aucun prix.</p>
        <div className="mt-4 space-y-2">
          {theme.categories.map((category) => (
            <details key={category} className="group rounded-lg border border-border bg-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span>{category}</span>
                <span aria-hidden className="text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {theme.services
                  .filter((s) => s.category === category)
                  .map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div>
                        <p>{s.name}</p>
                        {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                        {s.durationMin != null && <p className="mt-0.5 text-xs text-muted-foreground">{formatDuration(s.durationMin)}</p>}
                      </div>
                      {s.price != null && <p className="shrink-0 font-semibold text-primary">{formatPrice(s.price)}</p>}
                    </li>
                  ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <GiftCards />

      {/* Spas, horaires, contact */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-heading text-2xl font-bold">Nos spas</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <li key={s.id}>
              <Card className="h-full p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="size-4 text-primary" aria-hidden /> {s.name}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.address}</p>
              </Card>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Clock className="size-5 text-primary" aria-hidden /> Horaires
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {theme.schedule?.map((r) => (
                <li key={r.label}>
                  {r.label} : {hhmm(r.open)} – {hhmm(r.close)}
                </li>
              ))}
            </ul>
            {theme.hoursToConfirm && <p className="mt-1 text-xs italic text-muted-foreground">Horaires à confirmer par site.</p>}
          </div>
          <div>
            <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Mail className="size-5 text-primary" aria-hidden /> Contact
            </h3>
            {theme.contactEmail && (
              <p className="mt-2 text-sm">
                <a href={`mailto:${theme.contactEmail}`} className="text-primary underline underline-offset-2">
                  {theme.contactEmail}
                </a>
              </p>
            )}
            {theme.socials && (
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Réseaux sociaux">
                {theme.socials.map((s) => (
                  <li key={s.network}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg">
            <Link href="/reserver">Prendre rendez-vous</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
