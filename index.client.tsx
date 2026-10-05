import type { PluginClientContext } from "@getpaseo/plugin/client";
import { asanaTasks } from "./shared/contracts";
import { SettingsScreen } from "./client/settings-screen";
import { createTasksSurface } from "./client/tasks-surface";

export default function contribute(client: PluginClientContext) {
  client.addSettingsScreen({ id: "connection", title: "Asana", icon: "KeyRound", Component: SettingsScreen });
  client.addSurface("tasks", createTasksSurface(() => client.openSettings("connection")));
  client.addSidebarItem({ id: "tasks", title: "Asana", icon: "ListTodo", surface: "tasks" });
  client.addAttachmentSource(asanaTasks);
  return () => {};
}
