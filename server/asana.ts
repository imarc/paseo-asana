import type { Task } from "../shared/contracts";

const BASE = "https://app.asana.com/api/1.0";

async function asanaGet<T>(path: string, token: string): Promise<{ data: T; next_page?: { offset: string } | null }> {
  const response = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (response.status === 401) throw new Error("Asana rejected the token");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { errors?: { message?: string }[] } | null;
    const detail = body?.errors?.[0]?.message ?? response.statusText;
    throw new Error(`Asana request failed (${response.status}): ${detail}`);
  }
  return response.json() as Promise<{ data: T; next_page?: { offset: string } | null }>;
}

export async function getMe(token: string) {
  const { data } = await asanaGet<{ name: string; workspaces: { gid: string; name: string }[] }>(
    "/users/me?opt_fields=name,workspaces.name",
    token,
  );
  return { name: data.name, workspaces: data.workspaces.map(({ gid, name }) => ({ gid, name })) };
}

type AsanaTask = {
  gid: string;
  name: string;
  due_on: string | null;
  permalink_url: string;
  notes: string;
  memberships: { project?: { name: string } | null; section?: { name: string } | null }[];
};

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { at: number; tasks: Task[] }>();

/** Cached variant for per-keystroke search; `fetchMyTasks` always refreshes the cache. */
export async function cachedMyTasks(token: string, workspaceGid: string): Promise<Task[]> {
  const hit = cache.get(workspaceGid);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.tasks;
  return fetchMyTasks(token, workspaceGid);
}

export async function fetchMyTasks(token: string, workspaceGid: string): Promise<Task[]> {
  const params = new URLSearchParams({
    assignee: "me",
    workspace: workspaceGid,
    completed_since: "now",
    limit: "100",
    opt_fields: "name,due_on,permalink_url,notes,memberships.project.name,memberships.section.name",
  });
  const tasks: Task[] = [];
  let offset: string | undefined;
  do {
    if (offset) params.set("offset", offset);
    const page = await asanaGet<AsanaTask[]>(`/tasks?${params}`, token);
    for (const task of page.data) {
      tasks.push({
        gid: task.gid,
        name: task.name,
        dueOn: task.due_on ?? undefined,
        url: task.permalink_url,
        notes: task.notes || undefined,
        memberships: task.memberships.flatMap((m) =>
          m.project ? [{ project: m.project.name, section: m.section?.name }] : [],
        ),
      });
    }
    offset = page.next_page?.offset;
  } while (offset);
  tasks.sort(
    (a, b) =>
      (a.dueOn ?? "\uffff").localeCompare(b.dueOn ?? "\uffff") || a.name.localeCompare(b.name),
  );
  cache.set(workspaceGid, { at: Date.now(), tasks });
  return tasks;
}
