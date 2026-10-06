import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardList, Droplets, Flower2, Hand, MapPin, Waves, type LucideIcon } from "lucide-react";
import { theme } from "@/theme.config";
import { formatDuration, formatPrice } from "@/lib/utils";
import { sites } from "@/lib/sites";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { SectionTitle } from "../ui/section-title";
import { GiftCardStudio } from "./gift-card-studio";
import { HeroCarousel } from "./hero-carousel";

const FEATURED_ICONS: LucideIcon[] = [Flower2, Droplets, Waves, Hand];

/** Accueil Mahaza premium : contenu issu du site actuel (voir `theme.home` et le README pour le détail réel / fictif). */
export function MahazaHome() {
  const home = theme.home;
  if (!home) return null;

  return (
    <main id="contenu" tabIndex={-1} className="outline-none">
      <HeroCarousel />

      {/* La magie du bien-être */}
      <section className="relative mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 md:grid-cols-2 md:items-center">
        <Image
          src={home.decorImage.src}
          alt=""
          width={home.decorImage.width}
          height={home.decorImage.height}
          aria-hidden
          className="pointer-events-none absolute right-4 top-6 -z-10 w-28 opacity-50 sm:w-40"
        />
        <div className="relative">
          <span aria-hidden className="absolute -left-3 -top-3 hidden size-full rounded-3xl border border-accent md:block" />
          <Image
            src={home.about.image.src}
            alt={home.about.image.alt}
            width={home.about.image.width}
            height={home.about.image.height}
            sizes="(min-width: 768px) 480px, 100vw"
            className="relative h-auto w-full rounded-3xl object-cover shadow-lift"
          />
        </div>
        <div className="space-y-6">
          <SectionTitle kicker="Mahaza Beauty" title={home.about.title} lead={home.about.text} />
          <Button asChild size="lg">
            <Link href="/reserver">Réserver un soin</Link>
          </Button>
        </div>
      </section>

      {/* Soins vedettes */}
      <section id="soins" className="scroll-mt-20 bg-muted/60">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionTitle kicker="Nos soins signature" title="Nos soins vedettes" />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {home.featured.map((f, i) => {
              const Icon = FEATURED_ICONS[i % FEATURED_ICONS.length];
              return (
                <li key={f.title}>
                  <Card interactive className="flex h-full flex-col gap-4 p-6">
                    <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="font-heading text-2xl font-medium leading-tight">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Process en 3 étapes */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <SectionTitle kicker="Votre accompagnement" title="Votre parcours en 3 étapes" align="center" />
        <ol className="mt-14 grid gap-10 sm:grid-cols-3">
          {home.process.map((step, i) => (
            <li key={step.title} className="flex flex-col items-center gap-4 text-center">
              {step.image ? (
                <Image
                  src={step.image.src}
                  alt={step.image.alt}
                  width={step.image.width}
                  height={step.image.height}
                  sizes="128px"
                  className="size-32 rounded-full object-cover ring-1 ring-accent ring-offset-4 ring-offset-background"
                />
              ) : (
                // Étape 1 : pas d'image sur le site actuel -> icône.
                <span className="flex size-32 items-center justify-center rounded-full bg-secondary text-secondary-foreground ring-1 ring-accent ring-offset-4 ring-offset-background">
                  <ClipboardList className="size-12" aria-hidden />
                </span>
              )}
              <p className="font-heading text-2xl font-medium">
                <span className="text-primary">{i + 1}.</span> {step.title}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Catalogue */}
      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6">
        <SectionTitle kicker="Le catalogue" title="Nos services" lead="Tarifs communiqués par le spa : le site actuel n'affiche aucun prix." />
        <div className="mt-10 space-y-3">
          {theme.categories.map((category) => (
            <details key={category} className="group rounded-2xl border border-border bg-card shadow-soft transition-shadow open:shadow-lift">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-3 font-heading text-xl font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                <span>{category}</span>
                <span aria-hidden className="text-2xl leading-none text-primary transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none">+</span>
              </summary>
              <ul className="divide-y divide-border border-t border-border">
                {theme.services
                  .filter((s) => s.category === category)
                  .map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-4 px-5 py-3">
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
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/reserver">
              Composer ma réservation <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <GiftCardStudio />

      {/* Spas */}
      <section id="spas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
        <SectionTitle kicker="Douala · Yaoundé" title="Nos spas" />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <li key={s.id}>
              <Card interactive className="h-full p-6">
                <p className="flex items-center gap-2 font-heading text-2xl font-medium">
                  <MapPin className="size-4 text-primary" aria-hidden /> {s.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{s.address}</p>
              </Card>
            </li>
          ))}
        </ul>
        <div className="mt-14 text-center">
          <Button asChild size="lg">
            <Link href="/reserver">Prendre rendez-vous</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
