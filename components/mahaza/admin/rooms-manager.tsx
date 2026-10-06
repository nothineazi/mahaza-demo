"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { theme } from "@/theme.config";
import type { Room } from "@/data/types";
import { useAdminData } from "@/lib/mahaza/store";
import { FictiveBadge } from "@/components/fictive-badge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { FieldLabel, Input, Textarea } from "../ui/field";
import { Pill } from "../ui/pill";
import { Switch } from "../ui/switch";
import { Skeleton, LoadingRegion } from "../ui/skeleton";
import { toggle } from "./helpers";

export function RoomsManager() {
  const { ready, rooms, reservations, saveRoom, removeRoom, newId, siteId } = useAdminData();
  const [editing, setEditing] = useState<Room | null>(null);

  if (!ready) {
    return (
      <LoadingRegion label="Chargement des salles">
        <Skeleton className="mb-4 h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </LoadingRegion>
    );
  }

  const startNew = () => setEditing({ id: "", name: "", description: "", categories: [], active: true, siteId });
  const usage = (id: string) => reservations.filter((r) => r.lines.some((l) => l.roomId === id)).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-4xl font-medium">Salles</h1>
        <Button onClick={startNew}>
          <Plus /> Ajouter une salle
        </Button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {rooms.map((room) => (
          <li key={room.id}>
            <Card className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="flex flex-wrap items-center gap-2 font-heading text-2xl font-medium">
                    {room.name}
                    {room.fictive && <FictiveBadge />}
                  </p>
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                </div>
                <Pill tone={room.active ? "success" : "neutral"}>{room.active ? "Active" : "Inactive"}</Pill>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {room.categories.map((c) => (
                  <Pill key={c} tone="soft">{c}</Pill>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch id={`room-${room.id}`} checked={room.active} onCheckedChange={(v) => saveRoom({ ...room, active: v })} />
                  <label htmlFor={`room-${room.id}`} className="text-sm">Réservable</label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(room)}>
                  <Pencil /> Modifier<span className="sr-only"> {room.name}</span>
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {rooms.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-heading text-2xl font-medium">Aucune salle</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajoutez-en une pour ouvrir des créneaux à la réservation.</p>
        </Card>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent variant="sheet">
          {editing && (
            <RoomForm
              key={editing.id || "new"}
              initial={editing}
              isNew={editing.id === ""}
              usedBy={usage(editing.id)}
              onClose={() => setEditing(null)}
              onSave={(room) => {
                saveRoom(room.id ? room : { ...room, id: newId("r") });
                setEditing(null);
              }}
              onDelete={(id) => {
                removeRoom(id);
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
  initial: Room;
  isNew: boolean;
  usedBy: number;
  onClose: () => void;
  onSave: (room: Room) => void;
  onDelete: (id: string) => void;
}

function RoomForm({ initial, isNew, usedBy, onSave, onDelete, onClose }: FormProps) {
  const [form, setForm] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const valid = form.name.trim().length > 0 && form.categories.length > 0;

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSave({ ...form, name: form.name.trim(), description: form.description.trim() });
      }}
    >
      <DialogHeader>
        <DialogTitle>{isNew ? "Nouvelle salle" : `Modifier « ${initial.name} »`}</DialogTitle>
        <DialogDescription>Une salle n&apos;accueille que les soins des catégories cochées.</DialogDescription>
      </DialogHeader>
      <div>
        <FieldLabel htmlFor="room-name">Nom</FieldLabel>
        <Input id="room-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <FieldLabel htmlFor="room-desc">Description</FieldLabel>
        <Textarea id="room-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium">Catégories de soins</legend>
        {theme.categories.map((c) => (
          <label key={c} className="flex min-h-9 items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={form.categories.includes(c)} onChange={() => setForm({ ...form, categories: toggle(form.categories, c) })} />
            {c}
          </label>
        ))}
        {form.categories.length === 0 && <p className="text-xs text-destructive">Cochez au moins une catégorie.</p>}
      </fieldset>
      <DialogFooter className="sm:justify-between">
        {!isNew ? (
          usedBy > 0 ? (
            <p className="text-xs text-muted-foreground sm:max-w-52">Suppression impossible : {usedBy} réservation(s) liée(s). Désactivez la salle à la place.</p>
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
