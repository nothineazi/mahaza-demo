"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Copy, Gift, Info, MessageCircle } from "lucide-react";
import { theme } from "@/theme.config";
import { cn, formatPrice } from "@/lib/utils";
import { whatsappButtonClass, whatsappLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

/** Cartes cadeaux : sélection du montant uniquement, aucun paiement réel (instructions MoMo manuel). */
export function GiftCards() {
  const gift = theme.home?.gift;
  const [amount, setAmount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  if (!gift) return null;

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(theme.momo.merchantNumber.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : le numéro reste affiché à l'écran */
    }
  };

  const message = amount
    ? `Bonjour ${theme.name}, je souhaite offrir une carte cadeau de ${formatPrice(amount)}. J'ai envoyé ${formatPrice(amount)} par Mobile Money au ${theme.momo.merchantNumber}. Pouvez-vous me confirmer la réception ? Merci !`
    : "";

  return (
    <section id="cartes-cadeaux" className="bg-secondary">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 font-heading text-2xl font-bold text-secondary-foreground">
            <Gift className="size-6 text-primary" aria-hidden /> {gift.title}
          </h2>
          <p className="text-secondary-foreground">{gift.text}</p>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-secondary-foreground">Montant de la carte</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gift.amounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={amount === a}
                  onClick={() => setAmount(a)}
                  className={cn(
                    "h-12 rounded-md border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    amount === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary",
                  )}
                >
                  {formatPrice(a)}
                </button>
              ))}
            </div>
          </fieldset>

          {amount && (
            <div className="space-y-3 rounded-lg border border-primary/40 bg-card p-4 text-sm text-card-foreground">
              <p>
                Pour offrir une carte de <strong>{formatPrice(amount)}</strong>, envoyez ce montant par Mobile Money au numéro marchand :
              </p>
              <div className="flex items-center justify-between gap-3 rounded-md bg-muted p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Numéro marchand MoMo</p>
                  <p className="text-lg font-bold tracking-wide">{theme.momo.merchantNumber}</p>
                  <p className="text-xs text-muted-foreground">{theme.momo.merchantName}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={copyNumber}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copié" : "Copier"}
                </Button>
              </div>
              <Button asChild variant="whatsapp" size="lg" className={cn("w-full", whatsappButtonClass)}>
                <a href={whatsappLink(theme.whatsappNumber, message)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle />
                  Envoyer ma demande sur WhatsApp
                </a>
              </Button>
              <p className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                Démo : aucun paiement réel n&apos;est effectué sur ce site. Mahaza vérifie la réception du paiement manuellement.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <Image
            src={gift.image.src}
            alt={gift.image.alt}
            width={gift.image.width}
            height={gift.image.height}
            sizes="(min-width: 768px) 480px, 100vw"
            className="h-auto w-full rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
