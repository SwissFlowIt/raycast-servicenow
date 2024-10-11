import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { useCachedState, useFetch } from "@raycast/utils";
import { filter, flattenDeep, map, sumBy } from "lodash";
import TableDropdown from "./TableDropdown";
import { getTableIconAndColor } from "../utils/getTableIconAndColor";
import SearchResultListItem from "./SearchResultListItem";
import { Instance } from "../hooks/useInstances";

export default function ({
  instance,
  searchTerm,
  mutateHistory,
}: {
  instance: Instance;
  searchTerm: string;
  mutateHistory?: () => Promise<void>;
}): JSX.Element {
  const [navigationTitle, setNavigationTitle] = useState<string>("");
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [table] = useCachedState<string>("table", "all");
  const [errorFetching, setErrorFetching] = useState<boolean>(false);

  const instanceUrl = `https://${instance.name}.service-now.com`;

  const { isLoading, data, mutate } = useFetch(
    `${instanceUrl}/api/now/globalsearch/search?sysparm_search=${searchTerm}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(instance.username + ":" + instance.password).toString("base64")}`,
      },

      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(
          Toast.Style.Failure,
          "Could not fetch results",
          error.message
        );
      },

      mapResult(response: any) {
        setErrorFetching(false);
        const recordsWithResults = filter(
          response.result.groups,
          (r) => r.result_count > 0
        );
        const data = flattenDeep(
          map(recordsWithResults, (r) =>
            filter(r.search_results, (x) => x.record_count > 0)
          )
        );
        mutateHistory?.();
        return { data };
      },
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (table !== "all") {
      const filteredResults = filter(data, (r) => r.name === table);
      setFilteredResults(filteredResults);
    } else if (data) {
      setFilteredResults(data);
    }
  }, [table, data]);

  useEffect(() => {
    if (isLoading)
      setNavigationTitle(
        `Text search > ${instance.alias ? instance.alias : instance.name} > Loading results...`
      );
    else if (errorFetching) setNavigationTitle(`Text search`);
    else {
      const count = sumBy(data, (r) => r.record_count);
      if (count == 0)
        setNavigationTitle(
          `Text search > ${instance.alias ? instance.alias : instance.name} > No results found for "${searchTerm}"`
        );
      else
        setNavigationTitle(
          `Text search > ${instance.alias ? instance.alias : instance.name} > ${count} result${count > 1 ? "s" : ""} for "${searchTerm}"`
        );
    }
  }, [data, searchTerm, isLoading]);

  return (
    <List
      navigationTitle={navigationTitle}
      searchBarPlaceholder="Filter by title, description, state, category or number..."
      isLoading={isLoading}
      searchBarAccessory={<TableDropdown tables={data} isLoading={isLoading} />}
    >
      {errorFetching ? (
        <List.EmptyView
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          title="Could not fetch results"
          description="Press ⏎ to refresh or try later again"
          actions={
            <ActionPanel>
              <Action title="Refresh" onAction={mutate} />
            </ActionPanel>
          }
        />
      ) : (
        filteredResults.map((result) => {
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
              {records.map((record: any) => (
                <SearchResultListItem
                  instance={instance}
                  key={record.sys_id}
                  result={record}
                  icon={icon}
                  label={result.label}
                  fields={result.fields}
                  mutateSearchResults={mutate}
                />
              ))}
              <List.Item
                icon={Icon.MagnifyingGlass}
                key={`${result.label}-all`}
                title={`View all ${result.label} matches`}
                actions={
                  <ActionPanel>
                    <List.Dropdown.Section
                      title={`View all ${result.label} matches`}
                    >
                      <Action.OpenInBrowser
                        title="Open in Browser"
                        url={`${instanceUrl}${result.all_results_url}`}
                      />
                      <Action.CopyToClipboard
                        title="Copy URL"
                        content={`${instanceUrl}${result.all_results_url}`}
                      />
                    </List.Dropdown.Section>
                  </ActionPanel>
                }
              />
            </List.Section>
          );
        })
      )}
    </List>
  );
}
