import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useCachedState } from "@raycast/utils";

import Instances from "../instances";

import useInstances, { Instance } from "../hooks/useInstances";

export default function Actions({ mutate }: { mutate: () => void }) {
  const { instances, mutate: mutateInstances } = useInstances();
  const [selectedInstance, setSelectedInstance] =
    useCachedState<Instance>("instance");

  return (
    <>
      <List.Dropdown.Section title="History">
        <Action
          icon={Icon.ArrowClockwise}
          title="Refresh"
          onAction={mutate}
          shortcut={{ modifiers: ["cmd"], key: "r" }}
        />
      </List.Dropdown.Section>
      <List.Dropdown.Section title="Instances">
        <Action.Push
          icon={Icon.Gear}
          title="Manage instances"
          target={<Instances />}
          onPop={mutateInstances}
          shortcut={{ modifiers: ["cmd"], key: "m" }}
        />
        <ActionPanel.Submenu
          title={"Select instance"}
          icon={Icon.Check}
          shortcut={{ modifiers: ["cmd"], key: "i" }}
        >
          {instances?.map((instance) => (
            <Action
              key={instance.id}
              icon={{
                source:
                  selectedInstance?.id == instance.id
                    ? Icon.CheckCircle
                    : Icon.Circle,
                tintColor: instance.color,
              }}
              title={instance.alias ? instance.alias : instance.name}
              onAction={() => {
                setSelectedInstance(instance);
              }}
            />
          ))}
        </ActionPanel.Submenu>
      </List.Dropdown.Section>
    </>
  );
}
