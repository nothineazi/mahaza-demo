"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { theme } from "@/theme.config";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const INTERVAL_MS = 6000;

/** Hero : alternance des visuels, sans lecture automatique si l'utilisateur préfère moins d'animations. */
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
      {/* Voile sombre : garantit un contraste AA du texte clair quel que soit le visuel. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-foreground/90 via-foreground/75 to-foreground/60" aria-hidden />

      <div className="mx-auto flex min-h-[560px] max-w-6xl flex-col items-start justify-center gap-7 px-4 py-20 text-background sm:min-h-[640px] sm:px-6">
        <p className="lux-fade-up text-xs font-semibold uppercase tracking-[0.32em] text-accent sm:text-sm">{home.heroKicker}</p>
        <h1 className="lux-fade-up max-w-3xl font-heading text-5xl font-medium leading-[1.05] [animation-delay:80ms] sm:text-7xl">{home.heroTitle}</h1>
        <p className="lux-fade-up max-w-xl text-lg leading-relaxed text-background/90 [animation-delay:160ms]">{theme.description}</p>
        <div className="lux-fade-up flex flex-wrap gap-3 [animation-delay:240ms]">
          <Button asChild variant="gold" size="lg">
            <Link href="/reserver">Prendre rendez-vous</Link>
          </Button>
          <Button asChild variant="outline-light" size="lg">
            <Link href="/#soins">Découvrir nos soins</Link>
          </Button>
        </div>
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
              className="flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <span className={cn("block size-2.5 rounded-full border border-background transition-colors", i === index ? "bg-background" : "bg-transparent")} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
