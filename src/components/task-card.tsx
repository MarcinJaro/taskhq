"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical } from "lucide-react";
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-slate-700/50 bg-slate-800/80 p-3 shadow-sm transition-all hover:border-slate-600 hover:shadow-md ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-slate-500" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab touch-none text-slate-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_COLORS[task.priority]}`}
              title={task.priority}
            />
            <h3 className="truncate text-sm font-medium text-slate-100">
              {task.title}
            </h3>
          </div>
          {task.description && (
            <p className="mb-2 line-clamp-2 text-xs text-slate-400">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${PROJECT_COLORS[task.project]}`}
            >
              {task.project}
            </Badge>
            {task.deadline && (
              <span
                className={`flex items-center gap-1 text-[10px] ${
                  isOverdue ? "text-red-400" : "text-slate-500"
                }`}
              >
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
