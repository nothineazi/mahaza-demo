"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { theme } from "@/theme.config";
import type { Room } from "@/data/types";
import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toggle } from "./helpers";

export function RoomsManager() {
  const { rooms, bookings, saveRoom, removeRoom, newId } = useStore();
  const [editing, setEditing] = useState<Room | null>(null);

  const startNew = () => setEditing({ id: "", name: "", description: "", categories: [], active: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-xl font-bold">Salles</h1>
        <Button onClick={startNew}>
          <Plus /> Ajouter une salle
        </Button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {rooms.map((room) => (
          <li key={room.id}>
            <Card className="flex h-full flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{room.name}</p>
                  <p className="text-sm text-muted-foreground">{room.description}</p>
                </div>
                <Badge variant={room.active ? "success" : "outline"}>{room.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {room.categories.map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
              <div className="mt-auto flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Switch id={`room-${room.id}`} checked={room.active} onCheckedChange={(v) => saveRoom({ ...room, active: v })} />
                  <Label htmlFor={`room-${room.id}`} className="text-sm">Réservable</Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(room)}>
                  <Pencil /> Modifier
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      {rooms.length === 0 && <p className="text-sm text-muted-foreground">Aucune salle. Ajoutez-en une pour ouvrir des créneaux.</p>}

      <RoomDialog
        room={editing}
        isNew={editing?.id === ""}
        usedBy={editing ? bookings.filter((b) => b.roomId === editing.id).length : 0}
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
    </div>
  );
}

interface RoomDialogProps {
  room: Room | null;
  isNew: boolean;
  usedBy: number;
  onClose: () => void;
  onSave: (room: Room) => void;
  onDelete: (id: string) => void;
}

function RoomDialog({ room, ...props }: RoomDialogProps) {
  return (
    <Dialog open={Boolean(room)} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent>{room && <RoomForm key={room.id || "new"} initial={room} {...props} />}</DialogContent>
    </Dialog>
  );
}

function RoomForm({ initial, isNew, usedBy, onSave, onDelete, onClose }: Omit<RoomDialogProps, "room"> & { initial: Room }) {
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
        <DialogDescription>Une salle n&apos;accueille que les services des catégories cochées.</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="room-name">Nom</Label>
        <Input id="room-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="room-desc">Description</Label>
        <Textarea id="room-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Catégories de services</legend>
        {theme.categories.map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={form.categories.includes(c)}
              onChange={() => setForm({ ...form, categories: toggle(form.categories, c) })}
            />
            {c}
          </label>
        ))}
        {form.categories.length === 0 && <p className="text-xs text-destructive">Cochez au moins une catégorie.</p>}
      </fieldset>
      <DialogFooter className="sm:justify-between">
        {!isNew ? (
          usedBy > 0 ? (
            <p className="text-xs text-muted-foreground sm:max-w-48">Suppression impossible : {usedBy} réservation(s) liée(s). Désactivez la salle à la place.</p>
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
