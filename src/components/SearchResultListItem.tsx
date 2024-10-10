import {
  Action,
  ActionPanel,
  Color,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { find, keys } from "lodash";

export default function SearchResultListItem({
  result,
  icon,
  label,
  mutateSearchResults,
}: {
  result: any;
  icon: string;
  label: string;
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

  let foundKey = find(dataKeys, (dataKey) => dataKey.includes("category"));
  if (foundKey) {
    const value = result.data[foundKey].display;
    if (value) {
      keywords = keywords.concat(value.split(/\s|\n/));
      accessories.push({
        tag: {
          value: value,
          color: Color.Green,
        },
      });
    }
  }
  foundKey = find(dataKeys, (dataKey) => dataKey.includes("state"));
  if (foundKey) {
    const value = result.data[foundKey].display;
    if (value) {
      keywords = keywords.concat(value.split(/\s|\n/));
      accessories.push({
        tag: {
          value: value,
          color: Color.Blue,
        },
      });
    }
  }

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
            <Action.OpenInBrowser
              title="Open in Browser"
              url={`${instanceUrl}${result.record_url}`}
            />
            <Action title="Show Details" icon={Icon.Sidebar} />
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
