"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, DoorOpen, LayoutDashboard, ListChecks, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/admin/planning", label: "Planning", icon: CalendarDays },
  { href: "/admin/reservations", label: "Réservations", icon: ListChecks },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/salles", label: "Salles", icon: DoorOpen },
  { href: "/admin/staff", label: "Staff", icon: UserRound },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation du back-office" className="border-b border-border bg-card">
      <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors duration-200",
                  active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
