import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { find, keys, set } from "lodash";
import ResultDetail from "./ResultDetail";
import ResultActions from "./ResultActions";
import useInstances, { Instance } from "../hooks/useInstances";
import { useCachedState } from "@raycast/utils";
import Instances from "../instances";

export default function SearchResultListItem({
  result,
  icon,
  label,
  fields,
  mutateSearchResults,
}: {
  result: any;
  icon: string;
  label: string;
  fields: any;
  mutateSearchResults: () => Promise<void>;
}) {
  const { instances } = useInstances();
  const [selectedInstance, setSelectedInstance] =
    useCachedState<Instance>("instance");

  const instanceUrl = `https://${selectedInstance?.name}.service-now.com`;

  if (result.metadata.thumbnailURL)
    icon = `${instanceUrl}/${result.metadata.thumbnailURL}`;

  const dataKeys = keys(result.data);
  const accessories: List.Item.Accessory[] = [];
  let keywords = [label, ...result.metadata.description?.split(/\s|\n/)];

  if (result.data.number) keywords.push(result.data.number.display);
  if (result.data.priority) {
    const priority = result.data.priority.value;
    if (priority == 1) {
      keywords.push("Critical");
      accessories.push({
        icon: {
          source: Icon.Bell,
          tintColor: Color.Red,
        },
        tooltip: "Critical Priority",
      });
    }

    if (priority == 2) {
      keywords.push("High");
      accessories.push({
        icon: {
          source: Icon.Bell,
          tintColor: Color.Orange,
        },
        tooltip: "High Priority",
      });
    }
  }
  const keysToCheck = [
    { key: "category", color: Color.Green },
    { key: "state", color: Color.Blue },
  ];

  keysToCheck.forEach(({ key, color }) => {
    const dataKey = dataKeys.find((dataKey) => dataKey.includes(key));
    if (dataKey && result.data[dataKey].display) {
      const value = result.data[dataKey].display;
      keywords = keywords.concat(value.split(/\s|\n/));
      accessories.push({
        tag: {
          value,
          color,
        },
      });
    }
  });

  if (!result.record_url.startsWith("/")) {
    result.record_url = "/" + result.record_url;
  }

  return (
    <List.Item
      key={result.sys_id}
      title={result.metadata.title || ""}
      subtitle={result.data.number?.display}
      icon={icon}
      keywords={keywords}
      actions={
        <ActionPanel>
          <ResultActions result={result}>
            <Action.Push
              title="Show Details"
              icon={Icon.Sidebar}
              target={<ResultDetail result={result} fields={fields} />}
            />
          </ResultActions>
          <Action
            icon={Icon.ArrowClockwise}
            title="Refresh"
            onAction={mutateSearchResults}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
          <Action.Push
            icon={Icon.Gear}
            title="Manage instances"
            target={<Instances />}
          />
          <ActionPanel.Submenu
            title={"Select instance for search"}
            icon={Icon.Check}
            shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
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
        </ActionPanel>
      }
      accessories={accessories}
    />
  );
}
