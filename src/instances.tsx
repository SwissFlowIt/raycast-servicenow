import {
  ActionPanel,
  Action,
  Icon,
  List,
  Keyboard,
  confirmAlert,
} from "@raycast/api";
import { useCachedState } from "@raycast/utils";

import InstanceForm from "./components/InstanceForm";

import useInstances, { Instance } from "./hooks/useInstances";
import { useEffect } from "react";

export default function Instances() {
  const { instances, addInstance, editInstance, deleteInstance } =
    useInstances();

  const [selectedInstance, setSelectedInstance] =
    useCachedState<Instance>("instance");

  useEffect(() => {
    if (!selectedInstance && instances.length > 0) {
      setSelectedInstance(instances[0]);
    }
  }, [instances, selectedInstance]);

  return (
    <List searchBarPlaceholder="Filter by name, alias, username...">
      {instances.map((instance) => {
        const {
          id: instanceId,
          alias,
          name: instanceName,
          username,
          password,
          color,
        } = instance;
        const aliasOrName = alias ? alias : instanceName;
        return (
          <List.Item
            key={instanceId}
            icon={{
              source:
                selectedInstance?.id == instanceId
                  ? Icon.CheckCircle
                  : Icon.Circle,
              tintColor: color,
            }}
            title={aliasOrName}
            subtitle={alias ? instanceName : ""}
            keywords={[instanceName, alias, username]}
            actions={
              <ActionPanel>
                <List.Dropdown.Section title={aliasOrName}>
                  <Action.Push
                    icon={Icon.Pencil}
                    title="Edit Instance Profile"
                    target={
                      <InstanceForm
                        onSubmit={editInstance}
                        instance={instance}
                      />
                    }
                  />
                  <Action.Push
                    icon={Icon.Plus}
                    title="Add Instance Profile"
                    target={<InstanceForm onSubmit={addInstance} />}
                  />
                  <Action
                    title="Delete Instance Profile"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={Keyboard.Shortcut.Common.Remove}
                    onAction={async () => {
                      if (
                        await confirmAlert({
                          title: "Remove Instance",
                          message: `Are you sure you want to delete "${alias ? alias + " (" + instanceName + ")" : instanceName}"?`,
                        })
                      ) {
                        await deleteInstance(instanceId);
                      }
                    }}
                  />
                </List.Dropdown.Section>
                <Action
                  icon={Icon.Checkmark}
                  title="Select Instance Profile"
                  shortcut={{ modifiers: ["cmd"], key: "i" }}
                  onAction={() => setSelectedInstance(instance)}
                ></Action>
                <Action.OpenInBrowser
                  shortcut={{ modifiers: ["cmd"], key: "b" }}
                  url={`https://${instanceName}.service-now.com/login.do?user_name=${username}&user_password=${password}&sys_action=sysverb_login`}
                ></Action.OpenInBrowser>
              </ActionPanel>
            }
            accessories={[{ text: username, icon: Icon.Person }]}
          />
        );
      })}

      {instances.length === 0 ? (
        <List.EmptyView
          title="No Instance Profiles Found"
          description="Press ⏎ to create your first instance profile"
          actions={
            <ActionPanel>
              <Action.Push
                icon={Icon.Plus}
                title="Add Instance Profile"
                target={<InstanceForm onSubmit={addInstance} />}
              />
            </ActionPanel>
          }
        />
      ) : (
        <List.EmptyView
          title="No Results"
          actions={
            <ActionPanel>
              <Action.Push
                icon={Icon.Plus}
                title="Add Instance Profile"
                target={<InstanceForm onSubmit={addInstance} />}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
