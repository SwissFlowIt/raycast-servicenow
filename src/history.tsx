import { useEffect, useState } from "react";
import {
  ActionPanel,
  Action,
  Icon,
  List,
  showToast,
  getPreferenceValues,
  Toast,
  Color,
} from "@raycast/api";
import fetch from "node-fetch";
import { useFetch } from "@raycast/utils";
import SearchResults from "./components/SearchResults";
import { filter } from "lodash";

export default function History() {
  const { instance, username, password } = getPreferenceValues<Preferences>();
  const instanceUrl = `https://${instance}.service-now.com`;

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredTerms, setFilteredTerms] = useState<any[]>([]);
  const [errorFetching, setErrorFetching] = useState<boolean>(false);

  const { isLoading, data, mutate } = useFetch(
    `${instanceUrl}/api/now/table/ts_query?sysparm_exclude_reference_link=true&sysparm_display_value=true&sysparm_query=user.name=${username}^ORDERBYDESCsys_created_on&sysparm_fields=sys_id,search_term`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!username,
      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch history");
      },

      mapResult(response: any) {
        setErrorFetching(false);

        return { data: response.result };
      },
      keepPreviousData: true,
    }
  );

  async function removeAllItemsFromHistory() {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Removing all items from history",
      });

      const promises = data.map((item: any) =>
        fetch(`${instanceUrl}/api/now/table/ts_query/${item.sys_id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
          },
        })
      );

      await Promise.all(promises);
      await mutate(Promise.resolve([]));
      await showToast({
        style: Toast.Style.Success,
        title: `All terms removed from history`,
      });
    } catch (error) {
      console.error(error);
      await mutate(Promise.resolve([]));
      showToast(Toast.Style.Failure, "Could not remove all items from history");
    }
  }

  async function removeItemFromHistory(item: any) {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: `Removing "${item.search_term}" from history`,
      });

      await fetch(`${instanceUrl}/api/now/table/ts_query/${item.sys_id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
        },
      });

      await mutate();

      await showToast({
        style: Toast.Style.Success,
        title: `Term "${item.search_term}" removed from history`,
      });
    } catch (error) {
      console.error(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed removing term from history",
      });
    }
  }

  useEffect(() => {
    if (!data) return;
    if (searchTerm) {
      setFilteredTerms(filter(data, (r) => r.search_term.includes(searchTerm)));
    } else setFilteredTerms(data);
  }, [data, searchTerm]);

  return (
    <List
      navigationTitle={`Text search${isLoading ? " - Loading history..." : ""}`}
      searchText={searchTerm}
      isLoading={isLoading}
      onSearchTextChange={setSearchTerm}
    >
      {searchTerm && (
        <List.Item
          title={`Search for "${searchTerm}"`}
          icon={Icon.MagnifyingGlass}
          actions={
            <ActionPanel>
              <Action.Push
                target={
                  <SearchResults
                    searchTerm={searchTerm}
                    mutateHistory={mutate}
                    setSearchTerm={setSearchTerm}
                  />
                }
                title={`Search for "${searchTerm}"`}
                icon={Icon.MagnifyingGlass}
              />
            </ActionPanel>
          }
        />
      )}
      {errorFetching ? (
        <List.EmptyView
          icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
          title="Could not fetch history"
          description="Press ⏎ to refresh or try again later"
          actions={
            <ActionPanel>
              <Action title="Refresh" onAction={mutate} />
            </ActionPanel>
          }
        />
      ) : data?.length && data.length > 0 ? (
        <List.Section title="History">
          {filteredTerms?.map((item: any) => (
            <List.Item
              key={item.sys_id}
              title={item.search_term}
              icon={Icon.Stopwatch}
              actions={
                <ActionPanel>
                  <Action.Push
                    target={<SearchResults searchTerm={item.search_term} />}
                    title={`Search for "${item.search_term}"`}
                    icon={Icon.MagnifyingGlass}
                  />
                  <List.Dropdown.Section>
                    <Action
                      title="Remove from History"
                      icon={Icon.XMarkCircle}
                      style={Action.Style.Destructive}
                      onAction={() => removeItemFromHistory(item)}
                    />
                    <Action
                      title="Clear All Items from History"
                      shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                      icon={Icon.XMarkCircleFilled}
                      style={Action.Style.Destructive}
                      onAction={removeAllItemsFromHistory}
                    />
                  </List.Dropdown.Section>
                  <Action
                    icon={Icon.ArrowClockwise}
                    title="Refresh"
                    onAction={mutate}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                </ActionPanel>
              }
              accessories={[
                {
                  icon: Icon.ArrowRightCircle,
                  tooltip: "Search for this term",
                },
              ]}
            />
          ))}
        </List.Section>
      ) : (
        <List.EmptyView
          title="No recent searches found"
          description="Type something to get started"
        />
      )}
    </List>
  );
}
