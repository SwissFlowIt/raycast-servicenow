/* eslint-disable @raycast/prefer-title-case */
import { useEffect, useState } from "react";
import {
  ActionPanel,
  Action,
  Icon,
  List,
  Color,
  Detail,
  Image,
  getPreferenceValues,
  showHUD,
  Clipboard,
  LaunchProps,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedPromise, useCachedState, useFetch } from "@raycast/utils";

import {
  filter,
  map,
  flattenDeep,
  find,
  keys,
  some,
  pick,
  sumBy,
} from "lodash";

const tagsColorMap = {
  category: "Yellow",
  state: "Blue",
  number: "SecondaryText",
};

const tableIconColorMap = {
  incident: { icon: "ExclamationMark", color: "Red" },
  group: { icon: "TwoPeople", color: "Blue" },
  sys_user: { icon: "Person", color: "Blue" },
  cmdb_ci: { icon: "HardDrive", color: "Orange" },
  pm_project: { icon: "Clipboard", color: "Purple" },
  change: { icon: "Cog", color: "Yellow" },
  problem: { icon: "Bug", color: "Magenta" },
  kb_knowledge: { icon: "Book", color: "Blue" },
  cat_item: { icon: "Cart", color: "Green" },
  req_item: { icon: "Box", color: "Green" },
  request: { icon: "Envelope", color: "Green" },
};

function getTableIconAndColor(tableName: string) {
  for (const key in tableIconColorMap) {
    if (tableName.includes(key)) {
      return tableIconColorMap[key as keyof typeof tableIconColorMap];
    }
  }
  return { icon: "Document", color: "SecondaryText" };
}

function TableDropdown(props: {
  tables: any[] | undefined;
  onTableTypeChange: (newValue: string) => void;
}) {
  const { tables = [], onTableTypeChange: onTableTypeChange } = props;

  return (
    <List.Dropdown
      tooltip="Select Table"
      storeValue={false}
      onChange={(newValue) => {
        onTableTypeChange(newValue);
      }}
    >
      <List.Dropdown.Item key="all" title="All" value="all" />
      {tables.map((table) => {
        const { icon, color } = getTableIconAndColor(table.name);

        return (
          <List.Dropdown.Item
            key={table.name}
            title={`${table.label_plural} (${table.record_count})`}
            value={table.name}
            icon={{
              source: Icon[icon as keyof typeof Icon],
              tintColor: Color[color as keyof typeof Color],
            }}
          />
        );
      })}
    </List.Dropdown>
  );
}

export default function Command(
  props: LaunchProps<{ arguments: Arguments.SearchText }>
) {
  const { instance, username, password } = getPreferenceValues<Preferences>();
  const { text } = props.arguments;

  //const [searchText, setSearchText] = useState("");
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [table, setTable] = useState<string>("all");

  const instanceUrl = `https://${instance}.service-now.com`;

  const { isLoading, data } = useFetch(
    `${instanceUrl}/api/now/globalsearch/search?sysparm_search=${text}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!text,
      onError: (error) => {
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch packages");
      },

      mapResult(response: any) {
        const recordsWithResults = filter(
          response.result.groups,
          (r) => r.result_count > 0
        );
        const data = flattenDeep(
          map(recordsWithResults, (r) =>
            filter(r.search_results, (x) => x.record_count > 0)
          )
        );
        return { data };
      },
      keepPreviousData: true,
    }
  );

  const onTableTypeChange = (newValue: string) => {
    setTable(newValue);
  };

  useEffect(() => {
    if (table !== "all") {
      const filteredResults = filter(data, (r) => r.name === table);
      setFilteredResults(filteredResults);
    } else if (data) {
      setFilteredResults(data);
    }
  }, [table, data]);

  return (
    <List
      navigationTitle={`ServiceNow - ${isLoading ? "Loading" : sumBy(data, (r) => r.record_count)} results for "${text}"`}
      searchBarPlaceholder="Filter by title..."
      isLoading={isLoading}
      searchBarAccessory={
        <TableDropdown tables={data} onTableTypeChange={onTableTypeChange} />
      }
    >
      {filteredResults.map((result) => {
        const records = result.records;
        const { icon: iconName, color: colorName } = getTableIconAndColor(
          result.name
        );
        var icon: any = {
          source: Icon[iconName as keyof typeof Icon],
          tintColor: Color[colorName as keyof typeof Color],
        };

        return (
          <List.Section
            key={result.label}
            title={`${result.label_plural} (${result.record_count})`}
          >
            {records.map((record: any) => {
              if (record.metadata.thumbnailURL)
                icon = `${instanceUrl}/${record.metadata.thumbnailURL}`;
              else {
              }

              const accessories: List.Item.Accessory[] = [];
              const dataKeys = keys(record.data);
              const tags = keys(tagsColorMap);

              tags.forEach((tag) => {
                const foundKey = find(dataKeys, (dataKey) =>
                  dataKey.includes(tag)
                );

                if (foundKey) {
                  const value = record.data[foundKey];
                  if (value.display)
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
              });

              if (!record.record_url.startsWith("/")) {
                record.record_url = "/" + record.record_url;
              }

              return (
                <List.Item
                  key={record.sys_id}
                  title={record.metadata.title}
                  subtitle={record.metadata.description}
                  icon={icon}
                  actions={
                    <ActionPanel>
                      <Action.OpenInBrowser
                        title="Open in Browser"
                        url={`${instanceUrl}${record.record_url}`}
                      />
                      <Action.CopyToClipboard
                        title="Copy URL"
                        content={`${instanceUrl}${record.record_url}`}
                      />
                    </ActionPanel>
                  }
                  accessories={accessories}
                />
              );
            })}
            <List.Item
              key={`${result.label}-all`}
              title={`View all ${result.label} matches`}
              icon={Icon.Eye}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open in Browser"
                    url={`${instanceUrl}${result.all_results_url}`}
                  />
                  <Action.CopyToClipboard
                    title="Copy URL"
                    content={`${instanceUrl}${result.all_results_url}`}
                  />
                </ActionPanel>
              }
            />
          </List.Section>
        );
      })}
    </List>
  );
}
