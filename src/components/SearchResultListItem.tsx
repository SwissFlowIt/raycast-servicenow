import {
  Action,
  ActionPanel,
  Color,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { find, keys } from "lodash";
import ResultDetail from "./ResultDetail";

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
  const { instance } = getPreferenceValues<Preferences>();

  const instanceUrl = `https://${instance}.service-now.com`;

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
      title={result.metadata.title}
      subtitle={result.data.number?.display}
      icon={icon}
      keywords={keywords}
      actions={
        <ActionPanel>
          <List.Dropdown.Section title={result.metadata.title}>
            <Action.Push
              title="Show Details"
              icon={Icon.Sidebar}
              target={
                <ResultDetail
                  result={result}
                  fields={fields}
                  accessories={accessories}
                />
              }
            />
            <Action.OpenInBrowser
              title="Open in Browser"
              url={`${instanceUrl}${result.record_url}`}
            />
          </List.Dropdown.Section>
          <List.Dropdown.Section>
            <Action.CopyToClipboard
              title="Copy URL"
              content={`${instanceUrl}${result.record_url}`}
            />
            <Action.CopyToClipboard
              title="Copy Title"
              content={`${instanceUrl}${result.metadata.title}`}
            />
            {result.data.number && (
              <Action.CopyToClipboard
                title="Copy Number"
                content={result.data.number.display}
              />
            )}
          </List.Dropdown.Section>

          <Action
            icon={Icon.ArrowClockwise}
            title="Refresh"
            onAction={mutateSearchResults}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
      accessories={accessories}
    />
  );
}
