import { type PluginSurfaceProps, usePaseo, useSettings } from "@getpaseo/plugin/client";
import { Modal, TextInput } from "@getpaseo/plugin/client/react-native";
import {
  SettingsAction,
  SettingsCard,
  SettingsInput,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
  SettingsSwitch,
} from "@getpaseo/plugin/client/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { chatSettings, type Task } from "../shared/contracts";
import { branchSlug, taskSnapshot } from "../shared/snapshot";

type Props = {
  task: Task | null;
  theme: PluginSurfaceProps["theme"];
  navigation: PluginSurfaceProps["navigation"];
  onClose(): void;
};

export function StartChatModal({ task, theme, navigation, onClose }: Props) {
  return (
    <Modal title="Start chat about task" open={task !== null} onOpenChange={(open) => !open && onClose()}>
      <Modal.Content>{task ? <StartChatForm key={task.gid} task={task} theme={theme} navigation={navigation} onClose={onClose} /> : null}</Modal.Content>
    </Modal>
  );
}

function StartChatForm({ task, theme, navigation, onClose }: Props & { task: Task }) {
  const paseo = usePaseo();
  const settings = useSettings(chatSettings);
  const saved = settings.status === "ready" ? settings.values : null;

  const projects = useQuery({
    queryKey: ["paseo-projects"],
    queryFn: async () => (await paseo.projects.list()).projects,
  });
  const providers = useQuery({
    queryKey: ["paseo-providers"],
    queryFn: async () =>
      (await paseo.providers.snapshot()).entries.flatMap((entry) => {
        const model = entry.models?.find((m) => m.isDefault) ?? entry.models?.[0];
        if (!entry.enabled || !model) return [];
        return [{ label: `${entry.label ?? entry.provider} · ${model.label}`, value: `${entry.provider}/${model.id}` }];
      }),
  });

  // User choices; null means "use the remembered or first available value".
  const [projectChoice, setProjectChoice] = useState<string | null>(null);
  const [providerChoice, setProviderChoice] = useState<string | null>(null);
  const [worktreeChoice, setWorktreeChoice] = useState<boolean | null>(null);
  const [branch, setBranch] = useState(() => branchSlug(task.name));
  const [prompt, setPrompt] = useState(() => taskSnapshot(task));
  const promptStyle = useMemo(
    () => ({
      minHeight: 160,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface1,
      color: theme.colors.foreground,
      textAlignVertical: "top" as const,
    }),
    [theme],
  );

  const projectList = projects.data ?? [];
  const providerList = providers.data ?? [];
  const pick = (choice: string | null, remembered: string | undefined, values: string[]) =>
    [choice, remembered].find((v): v is string => !!v && values.includes(v)) ?? values[0] ?? "";
  const projectId = pick(projectChoice, saved?.projectId, projectList.map((p) => p.projectId));
  const provider = pick(providerChoice, saved?.provider, providerList.map((p) => p.value));
  const project = projectList.find((p) => p.projectId === projectId);
  const isGit = project?.projectKind === "git";
  const worktree = isGit && (worktreeChoice ?? saved?.worktree ?? false);

  const start = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error("Choose a project");
      const workspace = await paseo.workspaces.create({
        title: task.name,
        source: worktree
          ? { kind: "worktree", cwd: project.projectRootPath, projectId, action: "branch-off", branchName: branch.trim() }
          : { kind: "directory", path: project.projectRootPath, projectId },
      });
      const agent = await workspace.agents.create({ config: { provider }, prompt: prompt.trim() });
      if (saved && settings.status === "ready") {
        await settings.save({ projectId, provider, worktree: worktreeChoice ?? saved.worktree }, settings.revision);
      }
      return agent.id;
    },
    onSuccess: (agentId) => {
      onClose();
      navigation?.openAgent({ agentId });
    },
  });

  const loading = projects.isPending || providers.isPending;
  const loadError = projects.error?.message ?? providers.error?.message ?? null;
  const noProjects = projects.isSuccess && projectList.length === 0;
  const canStart =
    !loading &&
    !!project &&
    !!provider &&
    (!worktree || !!branch.trim()) &&
    !!prompt.trim() &&
    !start.isPending;

  return (
    <>
      <SettingsSection title={task.name}>
        <SettingsCard>
          {noProjects ? (
            <SettingsRow label="Project" error="Add a project in Paseo first." />
          ) : (
            <SettingsSelect
              label="Project"
              hint={loading ? "Loading…" : undefined}
              error={loadError}
              value={projectId}
              options={projectList.map((p) => ({ label: p.projectCustomName || p.projectDisplayName, value: p.projectId }))}
              disabled={loading || start.isPending}
              onValueChange={setProjectChoice}
            />
          )}
          <SettingsSwitch
            label="New git worktree"
            hint={project && !isGit ? "Only available for git projects." : undefined}
            value={worktree}
            disabled={!isGit || start.isPending}
            onValueChange={setWorktreeChoice}
          />
          {worktree ? (
            <SettingsInput
              label="Branch name"
              initialValue={branch}
              onChangeText={setBranch}
              disabled={start.isPending}
            />
          ) : null}
          <SettingsSelect
            label="Agent"
            value={provider}
            options={providerList}
            disabled={loading || start.isPending}
            onValueChange={setProviderChoice}
          />
        </SettingsCard>
      </SettingsSection>
      <SettingsSection title="Prompt">
        <TextInput
          accessibilityLabel="Prompt sent to the agent"
          multiline
          value={prompt}
          onChangeText={setPrompt}
          editable={!start.isPending}
          placeholderTextColor={theme.colors.foregroundMuted}
          placeholder="Describe what the agent should do"
          style={promptStyle}
        />
      </SettingsSection>
      <SettingsSection title="Start">
        <SettingsCard>
          <SettingsAction
            label={start.isPending ? "Starting…" : "Create workspace and agent"}
            error={start.error?.message ?? null}
            actionLabel="Start"
            disabled={!canStart}
            onPress={() => start.mutate()}
          />
        </SettingsCard>
      </SettingsSection>
    </>
  );
}
