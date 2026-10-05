import type { Task } from "./contracts";

const NOTES_LIMIT = 4000;

export function formatMembership(membership: Task["memberships"][number]): string {
  return membership.section ? `${membership.project} › ${membership.section}` : membership.project;
}

export function taskSnapshot(task: Task): string {
  const lines = [`Asana task: ${task.name}`, `URL: ${task.url}`];
  if (task.memberships.length) {
    lines.push("Projects:", ...task.memberships.map((m) => `- ${formatMembership(m)}`));
  }
  if (task.dueOn) lines.push(`Due: ${task.dueOn}`);
  const notes = task.notes?.trim();
  if (notes) {
    const truncated = notes.length > NOTES_LIMIT ? `${notes.slice(0, NOTES_LIMIT)}…` : notes;
    lines.push("", "Notes:", truncated);
  }
  return lines.join("\n");
}

export function branchSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
  return `asana/${slug}`;
}
