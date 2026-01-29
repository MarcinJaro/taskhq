import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
    // Auto-archive: when task was marked done (for 7-day auto-hide)
    doneAt: v.optional(v.number()),
    // Manual archive flag
    archived: v.optional(v.boolean()),
  })
    .index("by_status", ["status", "order"])
    .index("by_archived", ["archived"]),
});
