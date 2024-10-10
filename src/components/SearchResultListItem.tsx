import {
  Action,
  ActionPanel,
  Color,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { find, keys } from "lodash";

const tagsColorMap = {
  category: "Yellow",
  state: "Blue",
  number: "SecondaryText",
};

export default function SearchResultListItem({
  result,
  icon,
  mutateSearchResults,
}: {
  result: any;
  icon: string;
  mutateSearchResults: () => Promise<void>;
}) {
  const { instance } = getPreferenceValues<Preferences>();

  const instanceUrl = `https://${instance}.service-now.com`;

  if (result.metadata.thumbnailURL)
    icon = `${instanceUrl}/${result.metadata.thumbnailURL}`;

  const accessories: List.Item.Accessory[] = [];
  const dataKeys = keys(result.data);
  const tags = keys(tagsColorMap);
  const keywords = [result.metadata.description];

  tags.forEach((tag) => {
    const foundKey = find(dataKeys, (dataKey) => dataKey.includes(tag));

    if (foundKey) {
      const value = result.data[foundKey];
      if (value.display) {
        keywords.push(value.display);
        accessories.push({
          tag: {
            value: value.display,
            color:
              Color[
                tagsColorMap[
                  tag as keyof typeof tagsColorMap
                ] as keyof typeof Color
              ],
          },
        });
      }
    }
  });

  if (!result.record_url.startsWith("/")) {
    result.record_url = "/" + result.record_url;
  }

  return (
    <List.Item
      key={result.sys_id}
      title={result.metadata.title}
      subtitle={result.metadata.description}
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
