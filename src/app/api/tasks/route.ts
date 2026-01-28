import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
  }
  return new ConvexHttpClient(url);
}

export async function GET() {
  try {
    const client = getClient();
    const tasks = await client.query(api.tasks.list);
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();

    const { title, description, status, priority, project, deadline } = body;

    if (!title || !status || !priority || !project) {
      return NextResponse.json(
        { error: "Missing required fields: title, status, priority, project" },
        { status: 400 }
      );
    }

    const validStatuses = ["backlog", "todo", "in_progress", "review", "done"];
    const validPriorities = ["high", "medium", "low"];
    const validProjects = ["NS", "CR", "BuzzGen", "BuzzRank", "Cherrypad", "Other"];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` },
        { status: 400 }
      );
    }
    if (!validProjects.includes(project)) {
      return NextResponse.json(
        { error: `Invalid project. Must be one of: ${validProjects.join(", ")}` },
        { status: 400 }
      );
    }

    const id = await client.mutation(api.tasks.create, {
      title,
      description: description || undefined,
      status,
      priority,
      project,
      deadline: deadline || undefined,
      order: Date.now(),
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const client = getClient();
    const body = await request.json();

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    await client.mutation(api.tasks.update, {
      id,
      ...updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update task" },
      { status: 500 }
    );
  }
}
