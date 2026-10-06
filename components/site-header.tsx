import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <BrandLogo />
        <Button asChild size="sm">
          <Link href="/reserver">Réserver</Link>
        </Button>
      </div>
    </header>
  );
}
