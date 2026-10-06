"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { theme } from "@/theme.config";
import type { Practitioner } from "@/data/types";
import { useAdminSiteData } from "@/lib/store";
import { FictiveBadge } from "@/components/fictive-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toggle } from "./helpers";

export function StaffManager() {
  const { staff, bookings, saveStaff, removeStaff, newId, siteId } = useAdminSiteData();
  const [editing, setEditing] = useState<Practitioner | null>(null);

  const startNew = () => setEditing({ id: "", name: "", role: "", serviceIds: [], active: true, siteId });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Staff</h1>
        <Button onClick={startNew}>
          <Plus /> Ajouter un praticien
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {staff.map((p) => (
          <li key={p.id}>
            <Card className="flex h-full flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-lg font-bold text-secondary-foreground">
                    {p.name.charAt(0)}
                  </span>
                  <div>
                    <p className={p.fictive ? "flex flex-wrap items-center gap-2 font-semibold" : "font-semibold"}>{p.name}{p.fictive && <FictiveBadge />}</p>
                    <p className="text-sm text-muted-foreground">{p.role}</p>
                  </div>
                </div>
                <Badge variant={p.active ? "success" : "outline"}>{p.active ? "Actif" : "Inactif"}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.serviceIds.map((id) => (
                  <Badge key={id} variant="secondary">{theme.services.find((s) => s.id === id)?.name ?? id}</Badge>
                ))}
                {p.serviceIds.length === 0 && <span className="text-xs text-muted-foreground">Aucun service assigné</span>}
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch id={`staff-${p.id}`} checked={p.active} onCheckedChange={(v) => saveStaff({ ...p, active: v })} />
                  <Label htmlFor={`staff-${p.id}`} className="text-sm">Réservable</Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                  <Pencil /> Modifier
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {staff.length === 0 && <p className="text-sm text-muted-foreground">Aucun praticien. Ajoutez-en un pour ouvrir des créneaux.</p>}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          {editing && (
            <StaffForm
              key={editing.id || "new"}
              initial={editing}
              isNew={editing.id === ""}
              usedBy={bookings.filter((b) => b.practitionerId === editing.id).length}
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

interface StaffFormProps {
  initial: Practitioner;
  isNew: boolean;
  usedBy: number;
  onClose: () => void;
  onSave: (member: Practitioner) => void;
  onDelete: (id: string) => void;
}

function StaffForm({ initial, isNew, usedBy, onSave, onDelete, onClose }: StaffFormProps) {
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
        <DialogDescription>Un praticien n&apos;est proposé que pour les services cochés.</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="staff-name">Nom</Label>
        <Input id="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="staff-role">Fonction</Label>
        <Input id="staff-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Services assurés</legend>
        {theme.categories.map((category) => (
          <div key={category} className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">{category}</p>
            {theme.services
              .filter((s) => s.category === category)
              .map((s) => (
                <label key={s.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.serviceIds.includes(s.id)}
                    onChange={() => setForm({ ...form, serviceIds: toggle(form.serviceIds, s.id) })}
                  />
                  {s.name}
                </label>
              ))}
          </div>
        ))}
      </fieldset>
      <DialogFooter className="sm:justify-between">
        {!isNew ? (
          usedBy > 0 ? (
            <p className="text-xs text-muted-foreground sm:max-w-48">Suppression impossible : {usedBy} réservation(s) liée(s). Désactivez le praticien à la place.</p>
          ) : confirmDelete ? (
            <Button type="button" variant="destructive" onClick={() => onDelete(initial.id)}>Confirmer la suppression</Button>
          ) : (
            <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>Supprimer</Button>
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
