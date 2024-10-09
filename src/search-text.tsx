/* eslint-disable @raycast/prefer-title-case */
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
} from "@raycast/api";
import { useCachedPromise, useCachedState } from "@raycast/utils";

import axios from "axios";
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
import { useEffect, useState } from "react";

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
  tables: any[];
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
  const { text } = props.arguments;

  /* const [showDetails, setShowDetails] = useCachedState("show-details", false);
  const [showPreview, setShowPreview] = useCachedState("show-preview", false); */
  /* const [showRecordInformation, setShowRecordInformation] = useCachedState(
    "show-record-information",
    false
  ); */
  const [isLoading, setIsLoading] = useState(true);
  //const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [table, setTable] = useState<string>("all");

  const preferences = getPreferenceValues<Preferences>();

  const instanceUrl = `https://${preferences.instance}.service-now.com`;

  useEffect(() => {
    const instance = axios.create({
      baseURL: `${instanceUrl}/api/now/`,
      auth: {
        username: preferences.username,
        password: preferences.password,
      },
    });

    const fetchRecords = async () => {
      instance
        .get(`globalsearch/search?sysparm_search=${text}`)
        .then((response) => {
          const recordsWithResults = filter(
            response.data.result.groups,
            (r) => r.result_count > 0
          );
          var results = flattenDeep(
            map(recordsWithResults, (r) =>
              filter(r.search_results, (x) => x.record_count > 0)
            )
          );

          setResults(results);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error: ", error.response?.data || error.message);
          setIsLoading(false);
        });
    };
    fetchRecords();
  }, []);

  const onTableTypeChange = (newValue: string) => {
    setTable(newValue);
  };

  useEffect(() => {
    if (table !== "all") {
      const filteredResults = filter(results, (r) => r.name === table);
      setFilteredResults(filteredResults);
    } else {
      setFilteredResults(results);
    }
  }, [table, results]);

  return (
    <List
      navigationTitle={`ServiceNow - ${isLoading ? "Loading" : sumBy(results, (r) => r.record_count)} results for "${text}"`}
      searchBarPlaceholder="Filter by title..."
      isLoading={isLoading}
      searchBarAccessory={
        <TableDropdown tables={results} onTableTypeChange={onTableTypeChange} />
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
