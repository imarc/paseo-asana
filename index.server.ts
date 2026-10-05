import type { PluginServerContext } from "@getpaseo/plugin/server";
import { cachedMyTasks, fetchMyTasks, getMe } from "./server/asana";
import { readToken, writeToken } from "./server/token";
import {
  chatSettings,
  connectionStatus,
  listTasks,
  searchTasks,
  setToken,
  workspaceSettings,
} from "./shared/contracts";
import { formatMembership, taskSnapshot } from "./shared/snapshot";

const SEARCH_LIMIT = 50;

export default function contribute(server: PluginServerContext) {
  const settings = server.registerSettings(workspaceSettings);
  server.registerSettings(chatSettings);

  async function resolveWorkspace(token: string): Promise<string> {
    const current = await settings.read();
    const saved = current.status === "ready" ? current.values.workspaceGid : "";
    if (saved) return saved;
    const first = (await getMe(token)).workspaces[0];
    if (!first) throw new Error("No Asana workspaces available for this token");
    return first.gid;
  }

  server.handle(connectionStatus, async () => {
    const token = await readToken();
    if (!token) return { hasToken: false };
    try {
      const me = await getMe(token);
      return { hasToken: true, user: { name: me.name }, workspaces: me.workspaces };
    } catch (error) {
      return { hasToken: true, error: (error as Error).message };
    }
  });

  server.handle(setToken, async ({ token }) => ({ hasToken: await writeToken(token) }));

  server.handle(listTasks, async () => {
    const token = await readToken();
    if (!token) return { status: "no-token" as const };
    return { status: "ok" as const, tasks: await fetchMyTasks(token, await resolveWorkspace(token)) };
  });

  server.handle(searchTasks, async ({ query }) => {
    const token = await readToken();
    if (!token) return { items: [] };
    const tasks = await cachedMyTasks(token, await resolveWorkspace(token));
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? tasks.filter((task) =>
          [task.name, ...task.memberships.map(formatMembership)].join("\n").toLowerCase().includes(needle),
        )
      : tasks;
    return {
      items: matches.slice(0, SEARCH_LIMIT).map((task) => {
        const first = task.memberships[0];
        return {
          id: task.gid,
          identifier: first?.project ?? "Asana",
          title: task.name,
          subtitle: [first && formatMembership(first), task.dueOn && `Due ${task.dueOn}`].filter(Boolean).join(" · ") || undefined,
          url: task.url,
          text: taskSnapshot(task),
          resourceType: "asana_task",
        };
      }),
    };
  });

  return () => {};
}
