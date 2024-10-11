import { useEffect, useState } from "react";
import {
  ActionPanel,
  Action,
  Icon,
  List,
  showToast,
  Toast,
  Color,
} from "@raycast/api";
import fetch from "node-fetch";
import { useCachedState, useFetch } from "@raycast/utils";
import { filter } from "lodash";

import SearchResults from "./components/SearchResults";
import useInstances, { Instance } from "./hooks/useInstances";
import InstanceForm from "./components/InstanceForm";
import Instances from "./instances";

export default function History() {
  const { instances, addInstance, mutate: mutateInstances } = useInstances();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filteredTerms, setFilteredTerms] = useState<any[]>([]);
  const [errorFetching, setErrorFetching] = useState<boolean>(false);
  const [instance, setInstance] = useCachedState<Instance | null>(
    "instance",
    null
  );

  const instanceUrl = `https://${instance?.name}.service-now.com`;

  const { isLoading, data, mutate } = useFetch(
    `${instanceUrl}/api/now/table/ts_query?sysparm_exclude_reference_link=true&sysparm_display_value=true&sysparm_query=sys_created_by=${instance?.username}^ORDERBYDESCsys_created_on&sysparm_fields=sys_id,search_term`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(instance?.username + ":" + instance?.password).toString("base64")}`,
      },
      execute: !!instance,
      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(
          Toast.Style.Failure,
          "Could not fetch history",
          error.message
        );
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
            Authorization: `Basic ${Buffer.from(instance?.username + ":" + instance?.password).toString("base64")}`,
          },
        })
      );

      const responses = await Promise.all(promises);
      const success = responses.every((res) => res.ok);

      if (success) {
        await mutate(Promise.resolve([]));
        await showToast({
          style: Toast.Style.Success,
          title: `All terms removed from history`,
        });
      } else {
        const failedResponses = responses.filter((res) => !res.ok);
        const messages = failedResponses.map((res) => res.statusText);
        await mutate(Promise.resolve([]));
        showToast(
          Toast.Style.Failure,
          "Could not remove all items from history",
          messages.join("\n")
        );
      }
    } catch (error: any) {
      console.error(error);
      await mutate(Promise.resolve([]));
      showToast(
        Toast.Style.Failure,
        "Could not remove all items from history",
        error.message
      );
    }
  }

  async function removeItemFromHistory(item: any) {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: `Removing "${item.search_term}" from history`,
      });

      const response = await fetch(
        `${instanceUrl}/api/now/table/ts_query/${item.sys_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${Buffer.from(instance?.username + ":" + instance?.password).toString("base64")}`,
          },
        }
      );

      if (response.ok) {
        await mutate();

        await showToast({
          style: Toast.Style.Success,
          title: `Term "${item.search_term}" removed from history`,
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed removing term from history",
          message: response.statusText,
        });
      }
    } catch (error: any) {
      console.error(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed removing term from history",
        message: error.message,
      });
    }
  }

  useEffect(() => {
    if (!data) return;
    if (searchTerm) {
      setFilteredTerms(filter(data, (r) => r.search_term.includes(searchTerm)));
    } else setFilteredTerms(data);
  }, [data, searchTerm]);

  const onInstanceChange = (newValue: string) => {
    const aux = instances.find((instance) => instance.id === newValue);
    if (aux) {
      setInstance(aux);
    }
  };

  return (
    <List
      navigationTitle={`Text search${instance ? " > " + (instance.alias ? instance.alias : instance.name) : ""}${isLoading ? " > Loading history..." : ""}`}
      searchText={searchTerm}
      isLoading={isLoading}
      onSearchTextChange={setSearchTerm}
      searchBarAccessory={
        <List.Dropdown
          isLoading={isLoading}
          defaultValue={instance?.id}
          tooltip="Select the instance you want to search in"
          onChange={(newValue) => {
            onInstanceChange(newValue);
          }}
        >
          <List.Dropdown.Section title="Instances">
            {instances.map((instance: Instance) => (
              <List.Dropdown.Item
                key={instance.id}
                title={instance.alias ? instance.alias : instance.name}
                value={instance.id}
                icon={{ source: Icon.CircleFilled, tintColor: instance.color }}
              />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {instances.length > 0 ? (
        <>
          {searchTerm && instance && (
            <List.Item
              title={`Search for "${searchTerm}"`}
              icon={Icon.MagnifyingGlass}
              actions={
                <ActionPanel>
                  <Action.Push
                    target={
                      <SearchResults
                        instance={instance}
                        searchTerm={searchTerm}
                      />
                    }
                    title={`Search for "${searchTerm}"`}
                    icon={Icon.MagnifyingGlass}
                    onPop={mutate}
                  />
                  <Action.Push
                    icon={Icon.Gear}
                    title="Manage instances"
                    target={<Instances />}
                    onPop={mutateInstances}
                  />
                </ActionPanel>
              }
            />
          )}
          {errorFetching ? (
            <List.EmptyView
              icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
              title="Could not fetch history"
              description="Press ⏎ to refresh or try later again"
              actions={
                <ActionPanel>
                  <Action title="Refresh" onAction={mutate} />
                  <Action.Push
                    icon={Icon.Gear}
                    title="Manage instances"
                    target={<Instances />}
                    onPop={mutateInstances}
                  />
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
                        target={
                          instance && (
                            <SearchResults
                              instance={instance}
                              searchTerm={item.search_term}
                            />
                          )
                        }
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
                      <Action.Push
                        icon={Icon.Gear}
                        title="Manage instances"
                        target={<Instances />}
                        onPop={mutateInstances}
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
              actions={
                <ActionPanel>
                  <Action title="Refresh" onAction={mutate} />
                  <Action.Push
                    icon={Icon.Gear}
                    title="Manage instances"
                    target={<Instances />}
                    onPop={mutateInstances}
                  />
                </ActionPanel>
              }
            />
          )}
        </>
      ) : (
        <List.EmptyView
          title="No instances found"
          description="Add an instance to get started"
          actions={
            <ActionPanel>
              <Action.Push
                title="Add instance"
                target={<InstanceForm onSubmit={addInstance} />}
              />
            </ActionPanel>
          }
        />
      )}
    </List>
  );
}
