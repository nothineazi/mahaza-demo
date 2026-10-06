"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Check, Copy, Gift, Info, MessageCircle, RotateCcw } from "lucide-react";
import { theme } from "@/theme.config";
import { cn, formatPrice } from "@/lib/utils";
import { generateGiftCode, giftCardMessage, giftCardWaLink, validateGiftAmount } from "@/lib/mahaza/gift-card";
import { phoneDigits } from "@/lib/mahaza/phone";
import { useMahazaStore, type GiftCard } from "@/lib/mahaza/store";
import { Button } from "../ui/button";
import { FieldError, FieldLabel, Input, Textarea } from "../ui/field";
import { SectionTitle } from "../ui/section-title";

const CUSTOM = "custom";

/** Aperçu visuel de la carte : dimensions fixes (aspect-ratio) donc aucun décalage pendant la saisie. */
export function GiftCardPreview({ amount, to, from, message, code }: { amount: number | null; to: string; from: string; message: string; code: string | null }) {
  const decor = theme.home?.decorImage;
  return (
    <div
      role="img"
      aria-label={`Aperçu de la carte cadeau${amount ? ` de ${formatPrice(amount)}` : ""}${to ? ` pour ${to}` : ""}. Carte fictive de démonstration.`}
      className="relative isolate aspect-[8/5] w-full overflow-hidden rounded-3xl bg-foreground p-5 text-background shadow-lift ring-1 ring-accent/60 sm:p-7"
    >
      <span aria-hidden className="absolute inset-2 -z-10 rounded-[1.25rem] border border-accent/40" />
      {decor && (
        <Image src={decor.src} alt="" width={decor.width} height={decor.height} aria-hidden className="pointer-events-none absolute -bottom-3 -right-3 -z-10 w-28 opacity-25 sm:w-36" />
      )}
      <div aria-hidden className="flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-2xl font-medium leading-none sm:text-3xl">Mahaza Beauty</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-accent sm:text-xs">Carte cadeau</p>
          </div>
          <span className="rotate-6 rounded-sm border border-accent px-2 py-0.5 text-[10px] font-semibold tracking-widest text-accent">FICTIF</span>
        </div>
        <div className="space-y-1">
          <p className="font-heading text-4xl font-medium text-accent sm:text-5xl">{amount ? formatPrice(amount) : "— FCFA"}</p>
          {(to || from) && (
            <p className="text-xs text-background/85 sm:text-sm">
              {to && <>Pour <strong className="font-semibold">{to}</strong></>}
              {to && from && " · "}
              {from && <>De la part de <strong className="font-semibold">{from}</strong></>}
            </p>
          )}
          {message && <p className="line-clamp-2 font-heading text-base italic leading-snug text-background/90 sm:text-lg">« {message} »</p>}
        </div>
        <p className="font-mono text-xs tracking-[0.25em] text-background/85 sm:text-sm">{code ?? "GC-····-····"}</p>
      </div>
    </div>
  );
}

/**
 * Cartes cadeaux : choix du montant, message personnalisé, aperçu, code FICTIF et envoi simulé via wa.me.
 * Aucun paiement réel ; la réception du paiement Mobile Money serait vérifiée manuellement.
 */
export function GiftCardStudio() {
  const gift = theme.home?.gift;
  const premium = theme.premium;
  const { addGiftCard } = useMahazaStore();
  const uid = useId();
  const [choice, setChoice] = useState<number | typeof CUSTOM | null>(null);
  const [customRaw, setCustomRaw] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
  const [card, setCard] = useState<GiftCard | null>(null);
  const [copied, setCopied] = useState(false);
  if (!gift || !premium) return null;
  const cfg = premium.giftCard;

  const customCheck = choice === CUSTOM ? validateGiftAmount(customRaw, cfg) : null;
  const amount = choice === CUSTOM ? (customCheck?.ok ? customCheck.amount : null) : choice;
  const amountError = !touched ? null : amount != null ? null : choice === CUSTOM && customCheck && !customCheck.ok ? customCheck.reason : "Choisissez le montant de la carte.";
  const phoneError = touched && phone.trim() && phoneDigits(phone).length < 8 ? "Numéro invalide (8 chiffres minimum), ou laissez vide." : null;

  const generate = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (amount == null || phoneError || (phone.trim() && phoneDigits(phone).length < 8)) return;
    setCard(addGiftCard({ code: generateGiftCode(), amount, from: from.trim(), to: to.trim(), message: message.trim() }));
  };

  const reset = () => {
    setCard(null);
    setChoice(null);
    setCustomRaw("");
    setFrom("");
    setTo("");
    setPhone("");
    setMessage("");
    setTouched(false);
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(theme.momo.merchantNumber.replace(/\s/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : le numéro reste affiché à l'écran */
    }
  };

  const shownCode = card?.code ?? null;
  const waMessage = card ? giftCardMessage(card, theme.name) : "";

  return (
    <section id="cartes-cadeaux" className="scroll-mt-20 bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-start">
        <div className="space-y-8">
          <SectionTitle kicker="Offrir un moment" title={gift.title} lead={gift.text} />

          <form onSubmit={generate} noValidate className="space-y-6">
            <fieldset disabled={Boolean(card)} className="space-y-6 disabled:opacity-80">
              <div role="group" aria-labelledby={`${uid}-amount`}>
                <p id={`${uid}-amount`} className="mb-2 text-sm font-medium text-secondary-foreground">Montant de la carte</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {gift.amounts.map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={choice === a}
                      onClick={() => setChoice(a)}
                      className={cn(
                        "min-h-12 rounded-full border text-sm font-semibold transition-[background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        choice === a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary",
                      )}
                    >
                      {formatPrice(a)}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={choice === CUSTOM}
                    onClick={() => setChoice(CUSTOM)}
                    className={cn(
                      "min-h-12 rounded-full border text-sm font-semibold transition-[background-color,border-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      choice === CUSTOM ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-card-foreground hover:border-primary",
                    )}
                  >
                    Autre montant
                  </button>
                </div>
                {choice === CUSTOM && (
                  <div className="mt-3 lux-fade">
                    <FieldLabel htmlFor={`${uid}-custom`}>Montant en FCFA</FieldLabel>
                    <Input
                      id={`${uid}-custom`}
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={`${cfg.minAmount} à ${cfg.maxAmount}`}
                      value={customRaw}
                      onChange={(e) => setCustomRaw(e.target.value)}
                      aria-invalid={Boolean(amountError)}
                      aria-describedby={`${uid}-amount-error ${uid}-custom-help`}
                    />
                    <p id={`${uid}-custom-help`} className="mt-1.5 text-xs text-secondary-foreground">
                      Entre {formatPrice(cfg.minAmount)} et {formatPrice(cfg.maxAmount)}, par pas de {formatPrice(cfg.stepAmount)} (pas FICTIF).
                    </p>
                  </div>
                )}
                <FieldError id={`${uid}-amount-error`}>{amountError}</FieldError>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor={`${uid}-to`} className="text-secondary-foreground">Pour (prénom)</FieldLabel>
                  <Input id={`${uid}-to`} autoComplete="off" maxLength={40} value={to} onChange={(e) => setTo(e.target.value)} placeholder="Facultatif" />
                </div>
                <div>
                  <FieldLabel htmlFor={`${uid}-from`} className="text-secondary-foreground">De la part de</FieldLabel>
                  <Input id={`${uid}-from`} autoComplete="given-name" maxLength={40} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Facultatif" />
                </div>
              </div>
              <div>
                <FieldLabel htmlFor={`${uid}-message`} className="text-secondary-foreground">Message personnalisé</FieldLabel>
                <Textarea
                  id={`${uid}-message`}
                  maxLength={cfg.messageMax}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Un petit mot pour accompagner la carte"
                  aria-describedby={`${uid}-message-count`}
                />
                <p id={`${uid}-message-count`} className="mt-1 text-right text-xs text-secondary-foreground">
                  {message.length} / {cfg.messageMax}
                </p>
              </div>
              <div>
                <FieldLabel htmlFor={`${uid}-phone`} className="text-secondary-foreground">WhatsApp du destinataire (facultatif)</FieldLabel>
                <Input
                  id={`${uid}-phone`}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="6 XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={Boolean(phoneError)}
                  aria-describedby={`${uid}-phone-error`}
                />
                <FieldError id={`${uid}-phone-error`}>{phoneError}</FieldError>
              </div>
            </fieldset>

            {!card && (
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                <Gift /> Générer ma carte cadeau (fictive)
              </Button>
            )}
          </form>
        </div>

        <div className="order-first space-y-5 lg:sticky lg:top-24 lg:order-none">
          <GiftCardPreview amount={amount} to={to.trim()} from={from.trim()} message={message.trim()} code={shownCode} />

          {card ? (
            <div className="lux-fade-up space-y-4 rounded-2xl border border-primary/40 bg-card p-5 text-sm text-card-foreground shadow-soft" aria-live="polite">
              <p className="font-heading text-2xl font-medium">Votre carte est prête</p>
              <p>
                Code fictif : <strong className="font-mono tracking-widest">{card.code}</strong>. Pour offrir cette carte de <strong>{formatPrice(card.amount)}</strong>, envoyez ce montant par Mobile Money au numéro marchand :
              </p>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Numéro marchand MoMo (placeholder)</p>
                  <p className="text-lg font-bold tracking-wide">{theme.momo.merchantNumber}</p>
                  <p className="text-xs text-muted-foreground">{theme.momo.merchantName}</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyNumber}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copié" : "Copier"}
                </Button>
              </div>
              <Button asChild variant="whatsapp" size="lg" className="w-full">
                <a href={giftCardWaLink(phone, waMessage)} target="_blank" rel="noopener noreferrer">
                  <MessageCircle /> {phone.trim() ? "Envoyer la carte au destinataire" : "Partager la carte sur WhatsApp"}
                </a>
              </Button>
              <p className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                Démo : l&apos;envoi est simulé (lien WhatsApp pré-rempli, à envoyer vous-même). Le code est fictif, non valable, et aucun paiement réel n&apos;est effectué.
              </p>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw /> Créer une autre carte
              </Button>
            </div>
          ) : (
            <p className="flex gap-2 text-xs text-secondary-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              L&apos;aperçu se met à jour en direct. Montant : fourchette du site actuel (20 000 – 100 000 FCFA) ; paliers et pas à confirmer par Mahaza.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
