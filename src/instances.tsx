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

export default function Instances() {
  const { instances, addInstance, editInstance, deleteInstance } =
    useInstances();

  const [selectedInstance, setSelectedInstance] =
    useCachedState<Instance>("instance");

  return (
    <List searchBarPlaceholder="Filter by name, alias, username...">
      {instances.map((instance) => {
        const {
          id: instanceId,
          alias,
          name: instanceName,
          username,
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
                    title="Edit instance"
                    target={
                      <InstanceForm
                        onSubmit={editInstance}
                        instance={instance}
                      />
                    }
                  />
                  <Action.Push
                    icon={Icon.Plus}
                    title="Add instance"
                    target={<InstanceForm onSubmit={addInstance} />}
                  />
                  <Action
                    title="Delete instance"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={Keyboard.Shortcut.Common.Remove}
                    onAction={async () => {
                      if (
                        await confirmAlert({
                          title: "Remove instance",
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
                  title="Set this instance for search"
                  shortcut={{ modifiers: ["cmd"], key: "i" }}
                  onAction={() => setSelectedInstance(instance)}
                ></Action>
              </ActionPanel>
            }
            accessories={[{ text: username, icon: Icon.Person }]}
          />
        );
      })}

      {instances.length === 0 ? (
        <List.EmptyView
          title="You don't have any saved instances."
          description="Press ⏎ to create your first instance"
          actions={
            <ActionPanel>
              <Action.Push
                icon={Icon.Plus}
                title="Add instance"
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
                title="Add instance"
                target={<InstanceForm onSubmit={addInstance} />}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
