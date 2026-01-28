"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, LayoutGrid } from "lucide-react";
import {
  STATUSES,
  STATUS_LABELS,
  PROJECTS,
  type Status,
} from "@/lib/constants";
import type { Doc, Id } from "../../convex/_generated/dataModel";

function Column({
  status,
  tasks,
  onTaskClick,
}: {
  status: Status;
  tasks: Doc<"tasks">[];
  onTaskClick: (task: Doc<"tasks">) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col rounded-xl border transition-colors ${
        isOver
          ? "border-slate-500 bg-slate-800/60"
          : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-300">
          {STATUS_LABELS[status]}
        </h2>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-800 px-1.5 text-xs font-medium text-slate-400">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto p-3"
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-xs text-slate-600">Brak zadań</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const tasks = useQuery(api.tasks.list);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const updateOrder = useMutation(api.tasks.updateOrder);

  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);
  const [editingTask, setEditingTask] = useState<Doc<"tasks"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    if (filterProject === "all") return tasks;
    return tasks.filter((t) => t.project === filterProject);
  }, [tasks, filterProject]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<Status, Doc<"tasks">[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };
    for (const task of filteredTasks) {
      grouped[task.status].push(task);
    }
    for (const status of STATUSES) {
      grouped[status].sort((a, b) => a.order - b.order);
    }
    return grouped;
  }, [filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = filteredTasks.find((t) => t._id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as Id<"tasks">;
    const task = filteredTasks.find((t) => t._id === taskId);
    if (!task) return;

    // Determine target status
    let targetStatus: Status;
    const overId = over.id as string;

    // Check if dropped on a column
    if (STATUSES.includes(overId as Status)) {
      targetStatus = overId as Status;
    } else {
      // Dropped on another task - find its status
      const overTask = filteredTasks.find((t) => t._id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
    }

    const newOrder = Date.now();

    if (task.status !== targetStatus) {
      updateStatus({ id: taskId, status: targetStatus, order: newOrder });
    } else {
      // Reorder within column
      updateOrder({ id: taskId, order: newOrder });
    }
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsCreating(true);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Doc<"tasks">) => {
    setEditingTask(task);
    setIsCreating(false);
    setDialogOpen(true);
  };

  if (tasks === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-slate-300" />
          Ładowanie...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-6 w-6 text-slate-400" />
          <h1 className="text-xl font-bold text-slate-100">TaskHQ</h1>
          <span className="text-sm text-slate-500">
            {tasks.length} {tasks.length === 1 ? "zadanie" : "zadań"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtruj projekt" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie projekty</SelectItem>
              {PROJECTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleNewTask} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nowe zadanie
          </Button>
        </div>
      </header>

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-4 md:overflow-x-visible">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={tasksByStatus[status]}
              onTaskClick={handleEditTask}
            />
          ))}
          <DragOverlay>
            {activeTask ? (
              <div className="w-[280px] rotate-3 opacity-90">
                <TaskCard task={activeTask} onClick={() => {}} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={isCreating ? null : editingTask}
      />
    </div>
  );
}
