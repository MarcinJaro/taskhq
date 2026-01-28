"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUSES,
  STATUS_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  PROJECTS,
} from "@/lib/constants";
import type { Doc } from "../../convex/_generated/dataModel";
import type { Status, Priority, Project } from "@/lib/constants";
import { Trash2 } from "lucide-react";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Doc<"tasks"> | null;
  defaultStatus?: Status;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = "todo",
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <TaskDialogForm
            task={task}
            defaultStatus={defaultStatus}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TaskDialogForm({
  task,
  defaultStatus,
  onClose,
}: {
  task?: Doc<"tasks"> | null;
  defaultStatus: Status;
  onClose: () => void;
}) {
  const createTask = useMutation(api.tasks.create);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<Status>(task?.status ?? defaultStatus);
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [project, setProject] = useState<Project>(task?.project ?? "Other");
  const [deadline, setDeadline] = useState(task?.deadline ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (task) {
      await updateTask({
        id: task._id,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        project,
        deadline: deadline || undefined,
      });
    } else {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        project,
        deadline: deadline || undefined,
        order: Date.now(),
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (task) {
      await removeTask({ id: task._id });
      onClose();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {task ? "Edytuj zadanie" : "Nowe zadanie"}
        </DialogTitle>
        <DialogDescription>
          {task
            ? "Zmień szczegóły zadania poniżej."
            : "Wypełnij formularz, aby dodać nowe zadanie."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Tytuł</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nazwa zadania..."
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Opis</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcjonalny opis..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as Status)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Priorytet</Label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Projekt</Label>
            <Select
              value={project}
              onValueChange={(v) => setProject(v as Project)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROJECTS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          {task && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Usuń
            </Button>
          )}
          <Button type="submit">{task ? "Zapisz" : "Dodaj"}</Button>
        </DialogFooter>
      </form>
    </>
  );
}
