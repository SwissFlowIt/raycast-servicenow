import {
  ActionPanel,
  Action,
  Icon,
  List,
  Keyboard,
  confirmAlert,
} from "@raycast/api";
import useInstances from "./hooks/useInstances";
import InstanceForm from "./components/InstanceForm";

export default function Instances() {
  const { instances, addInstance, editInstance, deleteInstance } =
    useInstances();

  return (
    <List>
      {instances.map((instance) => {
        return (
          <List.Item
            key={instance.id}
            icon={{ source: Icon.CircleFilled, tintColor: instance.color }}
            title={instance.alias ? instance.alias : instance.name}
            subtitle={instance.alias ? instance.name : ""}
            keywords={[instance.name, instance.alias]}
            actions={
              <ActionPanel>
                <Action.Push
                  icon={Icon.Pencil}
                  title="Edit instance"
                  target={
                    <InstanceForm onSubmit={editInstance} instance={instance} />
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
              </ActionPanel>
            }
            accessories={[
              {
                icon: Icon.ArrowRightCircle,
                tooltip: "Edit this instance",
              },
            ]}
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
