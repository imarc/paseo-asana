import { openExternalUrl, type PluginSurfaceProps, useRpc } from "@getpaseo/plugin/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { listTasks, type Task } from "../shared/contracts";
import { formatMembership } from "../shared/snapshot";
import { StartChatModal } from "./start-chat-modal";

type SortKey = "name" | "project" | "due";
type Sort = { key: SortKey; descending: boolean };

const sortValue: Record<SortKey, (task: Task) => string> = {
  name: (task) => task.name,
  project: (task) => (task.memberships[0] ? formatMembership(task.memberships[0]) : ""),
  due: (task) => task.dueOn ?? "",
};

// Blank values stay last in both directions.
function sortTasks(tasks: Task[], { key, descending }: Sort): Task[] {
  return [...tasks].sort((a, b) => {
    const x = sortValue[key](a);
    const y = sortValue[key](b);
    if (!x || !y) return x ? -1 : y ? 1 : 0;
    const order = x.localeCompare(y, undefined, { sensitivity: "base" });
    return descending ? -order : order;
  });
}

export function createTasksSurface(openSettings: () => void) {
  return function TasksSurface({ theme, layout, navigation }: PluginSurfaceProps) {
    const fetchTasks = useRpc(listTasks);
    const query = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks({}) });
    const [chatTask, setChatTask] = useState<Task | null>(null);
    const [sort, setSort] = useState<Sort>({ key: "due", descending: false });
    const tasks = useMemo(
      () => (query.data?.status === "ok" ? sortTasks(query.data.tasks, sort) : []),
      [query.data, sort],
    );
    const styles = useMemo(() => {
      const pad = layout.compact ? 16 : 24;
      return {
        screen: { flex: 1, backgroundColor: theme.colors.surface0 },
        header: {
          flexDirection: "row" as const,
          alignItems: "center" as const,
          justifyContent: "space-between" as const,
          paddingHorizontal: pad,
          paddingVertical: layout.compact ? 12 : 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        title: { color: theme.colors.foreground, fontSize: layout.compact ? 18 : 20, fontWeight: "600" as const },
        center: { padding: pad, gap: 12, alignItems: "flex-start" as const },
        message: { color: theme.colors.foregroundMuted },
        error: { color: theme.colors.statusDanger },
        button: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.colors.accent },
        buttonText: { color: theme.colors.accentForeground },
        row: {
          flexDirection: "row" as const,
          alignItems: (layout.compact ? "center" : "flex-start") as "center" | "flex-start",
          gap: 12,
          paddingHorizontal: pad,
          paddingVertical: layout.compact ? 10 : 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        taskCell: { flex: 3, gap: 2 },
        projectCell: { flex: 3, gap: 2 },
        dueCell: { width: 96 },
        actionCell: { width: 96, alignItems: "flex-end" as const },
        columnLabel: { color: theme.colors.foregroundMuted, fontSize: 12, fontWeight: "600" as const },
        columnLabelActive: { color: theme.colors.foreground },
        name: { color: theme.colors.foreground },
        meta: { color: theme.colors.foregroundMuted, fontSize: 12 },
        chatButton: {
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        chatButtonText: { color: theme.colors.foreground, fontSize: 12 },
      };
    }, [theme, layout.compact]);

    const button = (label: string, onPress: () => void) => (
      <Pressable accessibilityRole="button" accessibilityLabel={label} style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    );

    const chatButton = (task: Task) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Start chat about ${task.name}`}
        style={styles.chatButton}
        onPress={() => setChatTask(task)}
      >
        <Text style={styles.chatButtonText}>Start chat</Text>
      </Pressable>
    );

    const columnHeader = (key: SortKey, label: string, cellStyle: object) => {
      const active = sort.key === key;
      const direction = active && sort.descending ? "descending" : "ascending";
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${label}${active ? `, currently ${direction}` : ""}`}
          style={cellStyle}
          onPress={() =>
            setSort((current) =>
              current.key === key ? { key, descending: !current.descending } : { key, descending: false },
            )
          }
        >
          <Text style={[styles.columnLabel, active && styles.columnLabelActive]}>
            {label}
            {active ? (sort.descending ? " ▼" : " ▲") : ""}
          </Text>
        </Pressable>
      );
    };

    const memberships = (task: Task) =>
      task.memberships.map((m, index) => (
        <Text key={index} style={styles.meta}>
          {formatMembership(m)}
        </Text>
      ));

    const renderRow = (task: Task) => {
      const open = () => void openExternalUrl(task.url);
      const openLabel = `Open ${task.name} in Asana`;
      if (layout.compact) {
        return (
          <View key={task.gid} style={styles.row}>
            <Pressable accessibilityRole="link" accessibilityLabel={openLabel} style={styles.taskCell} onPress={open}>
              <Text style={styles.name}>{task.name}</Text>
              {memberships(task)}
              {task.dueOn ? <Text style={styles.meta}>Due {task.dueOn}</Text> : null}
            </Pressable>
            {chatButton(task)}
          </View>
        );
      }
      return (
        <View key={task.gid} style={styles.row}>
          <Pressable accessibilityRole="link" accessibilityLabel={openLabel} style={styles.taskCell} onPress={open}>
            <Text style={styles.name}>{task.name}</Text>
          </Pressable>
          <View style={styles.projectCell}>{memberships(task)}</View>
          <Text style={[styles.meta, styles.dueCell]}>{task.dueOn ?? ""}</Text>
          <View style={styles.actionCell}>{chatButton(task)}</View>
        </View>
      );
    };

    let body;
    if (query.isPending) {
      body = (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.foregroundMuted} />
        </View>
      );
    } else if (query.isError) {
      body = (
        <View style={styles.center}>
          <Text style={styles.error}>{query.error.message}</Text>
          {button("Retry", () => void query.refetch())}
        </View>
      );
    } else if (query.data.status === "no-token") {
      body = (
        <View style={styles.center}>
          <Text style={styles.message}>Add an Asana Personal Access Token to see your tasks.</Text>
          {button("Open settings", openSettings)}
        </View>
      );
    } else if (query.data.tasks.length === 0) {
      body = (
        <View style={styles.center}>
          <Text style={styles.message}>No open tasks</Text>
        </View>
      );
    } else {
      body = (
        <ScrollView>
          {layout.compact ? null : (
            <View style={styles.row}>
              {columnHeader("name", "Task", styles.taskCell)}
              {columnHeader("project", "Project › Section", styles.projectCell)}
              {columnHeader("due", "Due", styles.dueCell)}
              <View style={styles.actionCell} />
            </View>
          )}
          {tasks.map(renderRow)}
        </ScrollView>
      );
    }

    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>My Asana tasks</Text>
          {query.isFetching && !query.isPending ? (
            <ActivityIndicator color={theme.colors.foregroundMuted} />
          ) : (
            button("Refresh", () => void query.refetch())
          )}
        </View>
        {body}
        <StartChatModal task={chatTask} theme={theme} navigation={navigation} onClose={() => setChatTask(null)} />
      </View>
    );
  };
}
