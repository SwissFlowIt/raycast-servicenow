import { useEffect, useState } from "react";
import {
  Action,
  ActionPanel,
  Color,
  Icon,
  List,
  showToast,
  Toast,
} from "@raycast/api";
import { useCachedState, useFetch } from "@raycast/utils";
import { filter, flattenDeep, map, sumBy } from "lodash";

import TableDropdown from "./TableDropdown";
import Actions from "./Actions";
import SearchResultListItem from "./SearchResultListItem";

import { getTableIconAndColor } from "../utils/getTableIconAndColor";
import useInstances, { Instance } from "../hooks/useInstances";
import InstanceForm from "./InstanceForm";

export default function ({
  searchTerm,
  command,
}: {
  searchTerm: string;
  command: string;
}): JSX.Element {
  const {
    instances,
    addInstance,
    mutate: mutateInstances,
    isLoading: isLoadingInstances,
  } = useInstances();
  const [commandName] = useState<string>(
    command == "history" ? "Search" : "Quickly Search"
  );
  const [navigationTitle, setNavigationTitle] = useState<string>("");
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [table] = useCachedState<string>("table", "all");
  const [errorFetching, setErrorFetching] = useState<boolean>(false);
  const [selectedInstance, setSelectedInstance] =
    useCachedState<Instance>("instance");
  const {
    alias = "",
    name: instanceName = "",
    username = "",
    password = "",
  } = selectedInstance || {};

  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { isLoading, data, mutate } = useFetch(
    `${instanceUrl}/api/now/globalsearch/search?sysparm_search=${searchTerm}`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!selectedInstance,

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
        return { data };
      },
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (isLoadingInstances) return;

    if (!selectedInstance && instances.length > 0) {
      setSelectedInstance(instances[0]);
    }
  });

  useEffect(() => {
    if (table !== "all") {
      const filteredResults = filter(data, (r) => r.name === table);
      setFilteredResults(filteredResults);
    } else if (data) {
      setFilteredResults(data);
    }
  }, [table, data]);

  useEffect(() => {
    if (!selectedInstance || errorFetching) {
      setNavigationTitle(commandName);
      return;
    }

    const aliasOrName = alias ? alias : instanceName;

    if (isLoading) {
      setNavigationTitle(
        `${commandName} > ${aliasOrName} > Loading results...`
      );
      return;
    }
    const count = sumBy(data, (r) => r.record_count);
    if (count == 0)
      setNavigationTitle(
        `${commandName} > ${aliasOrName} > No results found for "${searchTerm}"`
      );
    else
      setNavigationTitle(
        `${commandName} > ${aliasOrName} > ${count} result${count > 1 ? "s" : ""} for "${searchTerm}"`
      );
  }, [data, searchTerm, isLoading, errorFetching, selectedInstance]);

  return (
    <List
      navigationTitle={navigationTitle}
      searchBarPlaceholder="Filter by title, description, state, category, number..."
      isLoading={isLoading}
      searchBarAccessory={<TableDropdown tables={data} isLoading={isLoading} />}
    >
      {!!selectedInstance ? (
        errorFetching ? (
          <List.EmptyView
            icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
            title="Could not fetch results"
            description="Press ⏎ to refresh or try later again"
            actions={
              <ActionPanel>
                <Actions mutate={mutate} />
              </ActionPanel>
            }
          />
        ) : data?.length && data.length > 0 ? (
          filteredResults.map((result, index) => {
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
                key={result.name + "_" + index}
                title={`${result.label_plural} (${result.record_count})`}
              >
                {records.map((record: any) => (
                  <SearchResultListItem
                    key={record.sys_id}
                    result={record}
                    icon={icon}
                    label={result.label}
                    fields={result.fields}
                    mutateSearchResults={mutate}
                  />
                ))}
                <List.Item
                  icon={{
                    source: Icon.MagnifyingGlass,
                    tintColor: Color.SecondaryText,
                  }}
                  key={`${result.label}-all`}
                  title={`View all ${result.label} matches`}
                  actions={
                    <ActionPanel>
                      <List.Dropdown.Section
                        title={`View all ${result.label} matches`}
                      >
                        <Action.OpenInBrowser
                          title="Open in ServiceNow"
                          url={`${instanceUrl}${result.all_results_url}`}
                          icon={{ source: "servicenow.ico" }}
                        />
                        <Action.CopyToClipboard
                          title="Copy URL"
                          content={`${instanceUrl}${result.all_results_url}`}
                        />
                      </List.Dropdown.Section>
                      <Actions mutate={mutate} />
                    </ActionPanel>
                  }
                />
              </List.Section>
            );
          })
        ) : (
          <List.EmptyView
            title="No Results"
            actions={
              <ActionPanel>
                <Actions mutate={mutate} />
              </ActionPanel>
            }
          />
        )
      ) : (
        <List.EmptyView
          title="No instances found"
          description="Add an instance to get started"
          actions={
            <ActionPanel>
              <Action.Push
                title="Add instance"
                target={<InstanceForm onSubmit={addInstance} />}
                onPop={mutateInstances}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
