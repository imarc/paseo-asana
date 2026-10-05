import { defineAttachmentSource, defineRpc, defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

export const TaskSchema = z.object({
  gid: z.string(),
  name: z.string(),
  dueOn: z.string().optional(),
  url: z.string(),
  notes: z.string().optional(),
  memberships: z.array(z.object({ project: z.string(), section: z.string().optional() })),
});
export type Task = z.infer<typeof TaskSchema>;

export const WorkspaceSchema = z.object({ gid: z.string(), name: z.string() });

export const connectionStatus = defineRpc({
  name: "connection.status",
  input: z.object({}),
  output: z.object({
    hasToken: z.boolean(),
    user: z.object({ name: z.string() }).optional(),
    workspaces: z.array(WorkspaceSchema).optional(),
    error: z.string().optional(),
  }),
});

export const setToken = defineRpc({
  name: "connection.set-token",
  input: z.object({ token: z.string() }),
  output: z.object({ hasToken: z.boolean() }),
});

export const listTasks = defineRpc({
  name: "tasks.list",
  input: z.object({}),
  output: z.discriminatedUnion("status", [
    z.object({ status: z.literal("ok"), tasks: z.array(TaskSchema) }),
    z.object({ status: z.literal("no-token") }),
  ]),
});

export const workspaceSettings = defineSettings({
  id: "workspace",
  scope: "host",
  version: 1,
  schema: z.object({ workspaceGid: z.string().default("") }),
});

export const searchTasks = defineRpc({
  name: "tasks.search",
  input: z.object({ query: z.string() }),
  output: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        identifier: z.string(),
        title: z.string(),
        subtitle: z.string().optional(),
        url: z.string().url(),
        text: z.string(),
        resourceType: z.string(),
      }),
    ),
  }),
});

export const asanaTasks = defineAttachmentSource({
  id: "asana-task",
  title: "Asana task",
  icon: "ListTodo",
  pickerTitle: "Attach Asana task",
  searchPlaceholder: "Search by task or project",
  search: searchTasks,
});

export const chatSettings = defineSettings({
  id: "chat",
  scope: "host",
  version: 1,
  schema: z.object({
    projectId: z.string().default(""),
    provider: z.string().default(""),
    worktree: z.boolean().default(false),
  }),
});
