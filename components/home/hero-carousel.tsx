"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { theme } from "@/theme.config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const INTERVAL_MS = 6000;

/** Hero : alternance des visuels (hero-1 / hero-2), sans lecture automatique si l'utilisateur préfère moins d'animations. */
export function HeroCarousel() {
  const home = theme.home;
  const [index, setIndex] = useState(0);
  const count = home?.heroImages.length ?? 0;

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [count]);

  if (!home) return null;

  return (
    <section className="relative isolate overflow-hidden bg-foreground" aria-roledescription="carrousel" aria-label="Visuels du spa">
      {home.heroImages.map((img, i) => (
        <Image
          key={img.src}
          src={img.src}
          alt={i === index ? img.alt : ""}
          aria-hidden={i !== index}
          fill
          sizes="100vw"
          priority={i === 0}
          className={cn("-z-20 object-cover transition-opacity duration-1000 motion-reduce:transition-none", i === index ? "opacity-100" : "opacity-0")}
        />
      ))}
      {/* Voile sombre : garantit un contraste AA du texte blanc quel que soit le visuel. */}
      <div className="absolute inset-0 -z-10 bg-foreground/75" aria-hidden />

      <div className="mx-auto flex min-h-[460px] max-w-5xl flex-col items-start justify-center gap-5 px-4 py-14 text-background sm:min-h-[520px]">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{home.heroKicker}</p>
        <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">{home.heroTitle}</h1>
        <p className="max-w-xl text-base">{theme.description}</p>
        <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link href="/reserver">Prendre rendez-vous</Link>
        </Button>
      </div>

      {count > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1">
          {home.heroImages.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Afficher le visuel ${i + 1} sur ${count}`}
              aria-current={i === index}
              className="flex size-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className={cn("block size-2.5 rounded-full border border-background", i === index ? "bg-background" : "bg-transparent")} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
