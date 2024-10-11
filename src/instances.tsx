import {
  ActionPanel,
  Action,
  Icon,
  List,
  Keyboard,
  confirmAlert,
  Color,
} from "@raycast/api";
import useInstances, { Instance } from "./hooks/useInstances";
import InstanceForm from "./components/InstanceForm";
import { useCachedState } from "@raycast/utils";

export default function Instances() {
  const { instances, addInstance, editInstance, deleteInstance } =
    useInstances();

  const [selectedInstance, setSelectedInstance] =
    useCachedState<Instance>("instance");

  return (
    <List searchBarPlaceholder="Filter by name, alias, username...">
      {instances.map((instance) => {
        return (
          <List.Item
            key={instance.id}
            icon={{
              source:
                selectedInstance?.id == instance.id
                  ? Icon.CheckCircle
                  : Icon.Circle,
              tintColor: instance.color,
            }}
            title={instance.alias ? instance.alias : instance.name}
            subtitle={instance.alias ? instance.name : ""}
            keywords={[instance.name, instance.alias, instance.username]}
            actions={
              <ActionPanel>
                <List.Dropdown.Section
                  title={instance.alias ? instance.alias : instance.name}
                >
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
                          message: `Are you sure you want to delete "${instance.alias} (${instance.name})"?`,
                        })
                      ) {
                        await deleteInstance(instance.id);
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
            accessories={[{ text: instance.username, icon: Icon.Person }]}
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
