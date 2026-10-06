import { cn } from "@/lib/utils";

/** Titre de section : surtitre, titre serif, filet or. */
export function SectionTitle({
  kicker,
  title,
  lead,
  align = "left",
  as: Tag = "h2",
  tone = "default",
  className,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  tone?: "default" | "light";
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {kicker && <p className={cn("text-xs font-semibold uppercase tracking-[0.28em]", tone === "light" ? "text-accent" : "text-primary")}>{kicker}</p>}
      <Tag className="font-heading text-4xl font-medium leading-[1.1] sm:text-5xl">{title}</Tag>
      <span aria-hidden className={cn("block h-px w-14 bg-accent", align === "center" && "mx-auto")} />
      {lead && <p className={cn("text-base leading-relaxed", tone === "light" ? "text-background/80" : "text-foreground/75")}>{lead}</p>}
    </div>
  );
}
