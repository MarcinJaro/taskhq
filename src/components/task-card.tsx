"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical, AlertCircle } from "lucide-react";
import { PROJECT_COLORS, PRIORITY_COLORS } from "@/lib/constants";
import type { Doc } from "../../convex/_generated/dataModel";

interface TaskCardProps {
  task: Doc<"tasks">;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";
  
  const isDueSoon =
    task.deadline &&
    !isOverdue &&
    task.status !== "done" &&
    new Date(task.deadline).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000; // 2 days

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border bg-gradient-to-br transition-all duration-200 ${
        isDragging
          ? "opacity-50 shadow-2xl ring-2 ring-slate-500 scale-105"
          : "shadow-sm hover:shadow-md"
      } ${
        isOverdue
          ? "border-red-500/30 from-red-500/10 to-slate-800/80 hover:border-red-500/50"
          : isDueSoon
          ? "border-amber-500/30 from-amber-500/10 to-slate-800/80 hover:border-amber-500/50"
          : "border-slate-700/50 from-slate-800/80 to-slate-800/60 hover:border-slate-600"
      }`}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          className="mt-1 shrink-0 cursor-grab touch-none rounded p-1 text-slate-600 transition-all hover:bg-slate-700 hover:text-slate-400 active:cursor-grabbing md:opacity-0 md:group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
          <div className="mb-2 flex items-start gap-2">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[task.priority]} ${
                task.priority === "high" ? "animate-pulse" : ""
              }`}
              title={task.priority}
            />
            <h3 className="text-sm font-medium leading-tight text-slate-100">
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-slate-400">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${PROJECT_COLORS[task.project]}`}
            >
              {task.project}
            </Badge>
            {task.deadline && (
              <span
                className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                  isOverdue
                    ? "bg-red-500/20 text-red-400"
                    : isDueSoon
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-slate-700/50 text-slate-500"
                }`}
              >
                {isOverdue && <AlertCircle className="h-3 w-3" />}
                <Calendar className="h-3 w-3" />
                {new Date(task.deadline).toLocaleDateString("pl-PL", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
