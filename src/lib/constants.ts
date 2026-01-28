export const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  backlog: "Backlog",
  todo: "Do zrobienia",
  in_progress: "W trakcie",
  review: "Review",
  done: "Gotowe",
};

export const PRIORITIES = ["high", "medium", "low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "Wysoki",
  medium: "Średni",
  low: "Niski",
};

export const PROJECTS = ["NS", "CR", "BuzzGen", "BuzzRank", "Cherrypad", "Other"] as const;
export type Project = (typeof PROJECTS)[number];

export const PROJECT_COLORS: Record<Project, string> = {
  NS: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  CR: "bg-red-500/20 text-red-400 border-red-500/30",
  BuzzGen: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  BuzzRank: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Cherrypad: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Other: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: "bg-red-500",
  medium: "bg-orange-500",
  low: "bg-slate-500",
};
