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
  TouchSensor,
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
import { Plus, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import {
  STATUSES,
  STATUS_LABELS,
  PROJECTS,
  PROJECT_COLORS,
  type Status,
  type Project,
} from "@/lib/constants";
import type { Doc, Id } from "../../convex/_generated/dataModel";

function Column({
  status,
  tasks,
  onTaskClick,
  isActive,
}: {
  status: Status;
  tasks: Doc<"tasks">[];
  onTaskClick: (task: Doc<"tasks">) => void;
  isActive?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col rounded-xl border transition-all duration-200 ${
        isOver
          ? "border-slate-500 bg-slate-800/60 scale-[1.02]"
          : "border-slate-800 bg-slate-900/50"
      } ${isActive ? "ring-2 ring-slate-600" : ""}`}
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

function ProjectTabs({
  selected,
  onSelect,
  counts,
}: {
  selected: string;
  onSelect: (project: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect("all")}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
          selected === "all"
            ? "bg-slate-100 text-slate-900"
            : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
        }`}
      >
        Wszystko
        <span className="ml-1.5 opacity-60">{counts.all || 0}</span>
      </button>
      {PROJECTS.map((project) => {
        const colorClass = PROJECT_COLORS[project];
        const isSelected = selected === project;
        return (
          <button
            key={project}
            onClick={() => onSelect(project)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              isSelected
                ? colorClass.replace("/20", "/40").replace("/30", "/50")
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300"
            }`}
          >
            {project}
            {(counts[project] || 0) > 0 && (
              <span className="ml-1.5 opacity-60">{counts[project]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function MobileColumnNav({
  statuses,
  current,
  onSelect,
  counts,
}: {
  statuses: readonly Status[];
  current: number;
  onSelect: (index: number) => void;
  counts: Record<Status, number>;
}) {
  return (
    <div className="flex items-center justify-between px-2 py-2 md:hidden">
      <button
        onClick={() => onSelect(Math.max(0, current - 1))}
        disabled={current === 0}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex gap-1">
        {statuses.map((status, i) => (
          <button
            key={status}
            onClick={() => onSelect(i)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
              i === current
                ? "bg-slate-100 text-slate-900"
                : "bg-slate-800/50 text-slate-500"
            }`}
          >
            <span className="max-w-[60px] truncate">{STATUS_LABELS[status]}</span>
            <span className="opacity-60">{counts[status]}</span>
          </button>
        ))}
      </div>
      <button
        onClick={() => onSelect(Math.min(statuses.length - 1, current + 1))}
        disabled={current === statuses.length - 1}
        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

export function KanbanBoard() {
  const tasks = useQuery(api.tasks.list, {});
  const archivedTasks = useQuery(api.tasks.listArchived, {});
  const updateStatus = useMutation(api.tasks.updateStatus);
  const updateOrder = useMutation(api.tasks.updateOrder);

  const [activeTask, setActiveTask] = useState<Doc<"tasks"> | null>(null);
  const [editingTask, setEditingTask] = useState<Doc<"tasks"> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterProject, setFilterProject] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(1); // Start at "Do zrobienia"

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  const displayTasks = showArchived ? archivedTasks : tasks;

  const filteredTasks = useMemo(() => {
    if (!displayTasks) return [];
    if (filterProject === "all") return displayTasks;
    return displayTasks.filter((t) => t.project === filterProject);
  }, [displayTasks, filterProject]);

  const projectCounts = useMemo(() => {
    if (!displayTasks) return { all: 0 };
    const counts: Record<string, number> = { all: displayTasks.length };
    for (const task of displayTasks) {
      counts[task.project] = (counts[task.project] || 0) + 1;
    }
    return counts;
  }, [displayTasks]);

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

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };
    for (const task of filteredTasks) {
      counts[task.status]++;
    }
    return counts;
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

    let targetStatus: Status;
    const overId = over.id as string;

    if (STATUSES.includes(overId as Status)) {
      targetStatus = overId as Status;
    } else {
      const overTask = filteredTasks.find((t) => t._id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
    }

    const newOrder = Date.now();

    if (task.status !== targetStatus) {
      updateStatus({ id: taskId, status: targetStatus, order: newOrder });
    } else {
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

  if (displayTasks === undefined) {
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
      <header className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-100 md:text-xl">TaskHQ</h1>
            <span className="text-xs text-slate-500 md:text-sm">
              {filteredTasks.length} {filteredTasks.length === 1 ? "zadanie" : "zadań"}
            </span>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`rounded-lg p-2 transition-colors ${
                showArchived
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              }`}
              title={showArchived ? "Pokaż aktywne" : "Pokaż archiwum"}
            >
              <Archive className="h-4 w-4" />
            </button>
            <Button onClick={handleNewTask} size="sm" className="h-8 px-2">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ProjectTabs
          selected={filterProject}
          onSelect={setFilterProject}
          counts={projectCounts}
        />
        <div className="hidden items-center gap-3 md:flex">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              showArchived
                ? "bg-amber-500/20 text-amber-400"
                : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
            }`}
          >
            <Archive className="h-4 w-4" />
            {showArchived ? "Archiwum" : "Archiwum"}
            {archivedTasks && archivedTasks.length > 0 && (
              <span className="opacity-60">({archivedTasks.length})</span>
            )}
          </button>
          <Button onClick={handleNewTask} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Nowe zadanie
          </Button>
        </div>
      </header>

      {/* Mobile column navigation */}
      <MobileColumnNav
        statuses={STATUSES}
        current={mobileColumnIndex}
        onSelect={setMobileColumnIndex}
        counts={statusCounts}
      />

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Desktop: show all columns */}
          <div className="hidden w-full gap-4 md:flex">
            {STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onTaskClick={handleEditTask}
              />
            ))}
          </div>

          {/* Mobile: show single column */}
          <div className="flex w-full md:hidden">
            <Column
              status={STATUSES[mobileColumnIndex]}
              tasks={tasksByStatus[STATUSES[mobileColumnIndex]]}
              onTaskClick={handleEditTask}
              isActive
            />
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-full max-w-[280px] rotate-3 opacity-90">
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
