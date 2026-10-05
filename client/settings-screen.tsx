import { useRpc, useSettings } from "@getpaseo/plugin/client";
import {
  SettingsAction,
  SettingsCard,
  SettingsInput,
  type SettingsInputHandle,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
} from "@getpaseo/plugin/client/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { connectionStatus, setToken, workspaceSettings } from "../shared/contracts";

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const getStatus = useRpc(connectionStatus);
  const saveToken = useRpc(setToken);
  const settings = useSettings(workspaceSettings);
  const input = useRef<SettingsInputHandle>(null);
  const [draft, setDraft] = useState("");

  const status = useQuery({ queryKey: ["connection"], queryFn: () => getStatus({}) });
  const tokenMutation = useMutation({
    mutationFn: (token: string) => saveToken({ token }),
    onSuccess: () => {
      input.current?.replaceText("");
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["connection"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const connection = status.data;
  const verifyHint = status.isFetching
    ? "Checking…"
    : connection?.user
      ? `Connected as ${connection.user.name}`
      : undefined;
  const verifyError = status.error?.message ?? connection?.error ?? null;

  return (
    <>
      <SettingsSection title="Access token">
        <SettingsCard>
          <SettingsRow
            label="Status"
            hint={connection ? (connection.hasToken ? "Token saved" : "No token saved") : "Loading…"}
          />
          <SettingsInput
            ref={input}
            label="Personal Access Token"
            hint="Create one in Asana → Settings → Apps → Developer apps."
            placeholder="Paste token"
            secureTextEntry
            onChangeText={setDraft}
            error={tokenMutation.error?.message ?? null}
          />
          <SettingsAction
            label="Save token"
            actionLabel="Save"
            disabled={!draft.trim() || tokenMutation.isPending}
            onPress={() => tokenMutation.mutate(draft)}
          />
          <SettingsAction
            label="Remove saved token"
            actionLabel="Clear"
            disabled={!connection?.hasToken || tokenMutation.isPending}
            onPress={() => tokenMutation.mutate("")}
          />
          <SettingsAction
            label="Verify connection"
            hint={verifyHint}
            error={verifyError}
            actionLabel="Verify"
            disabled={!connection?.hasToken || status.isFetching}
            onPress={() => void status.refetch()}
          />
        </SettingsCard>
      </SettingsSection>
      <SettingsSection title="Workspace">
        <SettingsCard>
          {settings.status === "ready" ? (
            <SettingsSelect
              label="Asana workspace"
              hint={connection?.workspaces ? undefined : "Save a valid token to list workspaces."}
              error={settings.saveError}
              value={settings.values.workspaceGid}
              options={[
                { label: "First workspace (default)", value: "" },
                ...(connection?.workspaces ?? []).map((w) => ({ label: w.name, value: w.gid })),
              ]}
              disabled={settings.saving}
              onValueChange={async (workspaceGid) => {
                if (await settings.save({ ...settings.values, workspaceGid }, settings.revision)) {
                  void queryClient.invalidateQueries({ queryKey: ["tasks"] });
                }
              }}
            />
          ) : (
            <SettingsRow
              label="Asana workspace"
              hint={settings.status === "loading" ? "Loading…" : undefined}
              error={settings.status === "loading" ? null : settings.error}
            />
          )}
        </SettingsCard>
      </SettingsSection>
    </>
  );
}
