"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { theme } from "@/theme.config";
import type { Practitioner } from "@/data/types";
import { useAdminData } from "@/lib/mahaza/store";
import { FictiveBadge } from "@/components/fictive-badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { FieldLabel, Input } from "../ui/field";
import { Pill } from "../ui/pill";
import { Switch } from "../ui/switch";
import { Skeleton, LoadingRegion } from "../ui/skeleton";
import { toggle } from "./helpers";

export function StaffManager() {
  const { ready, staff, reservations, saveStaff, removeStaff, newId, siteId } = useAdminData();
  const [editing, setEditing] = useState<Practitioner | null>(null);

  if (!ready) {
    return (
      <LoadingRegion label="Chargement de l'équipe">
        <Skeleton className="mb-4 h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </LoadingRegion>
    );
  }

  const startNew = () => setEditing({ id: "", name: "", role: "", serviceIds: [], active: true, siteId });
  const usage = (id: string) => reservations.filter((r) => r.lines.some((l) => l.practitionerId === id)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-4xl font-medium">Staff</h1>
        <Button onClick={startNew}>
          <Plus /> Ajouter un praticien
        </Button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {staff.map((p) => (
          <li key={p.id}>
            <Card className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-xl font-medium text-secondary-foreground">{p.name.charAt(0)}</span>
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-heading text-2xl font-medium leading-tight">
                      {p.name}
                      {p.fictive && <FictiveBadge />}
                    </p>
                    <p className="text-sm text-muted-foreground">{p.role}</p>
                  </div>
                </div>
                <Pill tone={p.active ? "success" : "neutral"}>{p.active ? "Actif" : "Inactif"}</Pill>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.serviceIds.slice(0, 6).map((id) => (
                  <Pill key={id} tone="soft">{theme.services.find((s) => s.id === id)?.name ?? id}</Pill>
                ))}
                {p.serviceIds.length > 6 && <Pill tone="neutral">+{p.serviceIds.length - 6}</Pill>}
                {p.serviceIds.length === 0 && <span className="text-xs text-muted-foreground">Aucun soin assigné</span>}
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch id={`staff-${p.id}`} checked={p.active} onCheckedChange={(v) => saveStaff({ ...p, active: v })} />
                  <label htmlFor={`staff-${p.id}`} className="text-sm">Réservable</label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                  <Pencil /> Modifier<span className="sr-only"> {p.name}</span>
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {staff.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-heading text-2xl font-medium">Aucun praticien</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez-en un pour ouvrir des créneaux à la réservation.</p>
        </Card>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent variant="sheet">
          {editing && (
            <StaffForm
              key={editing.id || "new"}
              initial={editing}
              isNew={editing.id === ""}
              usedBy={usage(editing.id)}
              onClose={() => setEditing(null)}
              onSave={(member) => {
                saveStaff(member.id ? member : { ...member, id: newId("p") });
                setEditing(null);
              }}
              onDelete={(id) => {
                removeStaff(id);
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FormProps {
  initial: Practitioner;
  isNew: boolean;
  usedBy: number;
  onClose: () => void;
  onSave: (member: Practitioner) => void;
  onDelete: (id: string) => void;
}

function StaffForm({ initial, isNew, usedBy, onSave, onDelete, onClose }: FormProps) {
  const [form, setForm] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = form.name.trim().length > 0 && form.role.trim().length > 0;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ ...form, name: form.name.trim(), role: form.role.trim() });
      }}
    >
      <DialogHeader>
        <DialogTitle>{isNew ? "Nouveau praticien" : `Modifier « ${initial.name} »`}</DialogTitle>
        <DialogDescription>Un praticien n&apos;est proposé que pour les soins cochés.</DialogDescription>
      </DialogHeader>
      <div>
        <FieldLabel htmlFor="staff-name">Nom</FieldLabel>
        <Input id="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <FieldLabel htmlFor="staff-role">Fonction</FieldLabel>
        <Input id="staff-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-1 text-sm font-medium">Soins assurés</legend>
        {theme.categories.map((category) => (
          <div key={category} className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{category}</p>
            {theme.services
              .filter((s) => s.category === category)
              .map((s) => (
                <label key={s.id} className="flex min-h-9 items-center gap-2 text-sm">
                  <input type="checkbox" className="size-4 accent-primary" checked={form.serviceIds.includes(s.id)} onChange={() => setForm({ ...form, serviceIds: toggle(form.serviceIds, s.id) })} />
                  {s.name}
                </label>
              ))}
          </div>
        ))}
      </fieldset>
      <DialogFooter className="sm:justify-between">
        {!isNew ? (
          usedBy > 0 ? (
            <p className="text-xs text-muted-foreground sm:max-w-52">Suppression impossible : {usedBy} réservation(s) liée(s). Désactivez le praticien à la place.</p>
          ) : confirmDelete ? (
            <Button type="button" variant="danger" onClick={() => onDelete(initial.id)}>Confirmer la suppression</Button>
          ) : (
            <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>Supprimer</Button>
          )
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={!valid}>Enregistrer</Button>
        </div>
      </DialogFooter>
    </form>
  );
}
