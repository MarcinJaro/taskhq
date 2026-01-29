import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// 7 days in milliseconds
const ARCHIVE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export const list = query({
  args: {
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db.query("tasks").collect();
    const now = Date.now();
    
    // Filter out auto-archived (done > 7 days) unless requested
    if (args.includeArchived) {
      return tasks;
    }
    
    return tasks.filter((task) => {
      // Explicitly archived
      if (task.archived) return false;
      // Auto-archive: done for more than 7 days
      if (task.status === "done" && task.doneAt) {
        if (now - task.doneAt > ARCHIVE_THRESHOLD_MS) return false;
      }
      return true;
    });
  },
});

export const listArchived = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    const now = Date.now();
    
    return tasks.filter((task) => {
      if (task.archived) return true;
      if (task.status === "done" && task.doneAt) {
        if (now - task.doneAt > ARCHIVE_THRESHOLD_MS) return true;
      }
      return false;
    });
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    priority: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    project: v.union(
      v.literal("NS"),
      v.literal("CR"),
      v.literal("BuzzGen"),
      v.literal("BuzzRank"),
      v.literal("Cherrypad"),
      v.literal("Other")
    ),
    deadline: v.optional(v.string()),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("backlog"),
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("review"),
        v.literal("done")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    project: v.optional(
      v.union(
        v.literal("NS"),
        v.literal("CR"),
        v.literal("BuzzGen"),
        v.literal("BuzzRank"),
        v.literal("Cherrypad"),
        v.literal("Other")
      )
    ),
    deadline: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const task = await ctx.db.get(id);
    const now = Date.now();
    const updates: Record<string, unknown> = { updatedAt: now };
    
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    
    // Handle doneAt when status changes
    if (fields.status !== undefined) {
      if (fields.status === "done" && task?.status !== "done") {
        updates.doneAt = now;
      } else if (fields.status !== "done" && task?.status === "done") {
        updates.doneAt = undefined;
      }
    }
    
    await ctx.db.patch(id, updates);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done")
    ),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    const now = Date.now();
    
    // Set doneAt when moving to done, clear when moving away
    let doneAt = task?.doneAt;
    if (args.status === "done" && task?.status !== "done") {
      doneAt = now;
    } else if (args.status !== "done") {
      doneAt = undefined;
    }
    
    await ctx.db.patch(args.id, {
      status: args.status,
      order: args.order,
      updatedAt: now,
      doneAt,
    });
  },
});

export const archive = mutation({
  args: {
    id: v.id("tasks"),
    archived: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      archived: args.archived,
      updatedAt: Date.now(),
    });
  },
});

export const updateOrder = mutation({
  args: {
    id: v.id("tasks"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      order: args.order,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
