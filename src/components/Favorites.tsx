import { useMemo, useState } from "react";

import { Action, ActionPanel, Color, Icon, Keyboard, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useCachedState, useFetch } from "@raycast/utils";

import { FavoritesResponse, Instance } from "../types";
import useInstances from "../hooks/useInstances";
import Actions from "./Actions";
import InstanceForm from "./InstanceForm";
import { getTableIconAndColor } from "../utils/getTableIconAndColor";
import { filter, groupBy, orderBy } from "lodash";

export default function Favorites(props: { groupId?: string }) {
  const { groupId = "" } = props;
  const { instances, isLoading: isLoadingInstances, addInstance, mutate: mutateInstances } = useInstances();
  const [selectedInstance, setSelectedInstance] = useCachedState<Instance>("instance");
  const [errorFetching, setErrorFetching] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { id: instanceId = "", name: instanceName = "", username = "", password = "" } = selectedInstance || {};

  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { isLoading, data, mutate } = useFetch(
    () => {
      return `${instanceUrl}/api/now/table/sys_ui_bookmark?sysparm_query=userDYNAMIC90d1921e5f510100a9ad2572f2b477fe&sysparm_fields=sys_id,group.title,title,url,order,group.sys_id`;
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: selectedInstance && !groupId,
      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch tables", error.message);
      },

      mapResult(response: FavoritesResponse) {
        setErrorFetching(false);

        return { data: response.result, hasMore: response.result.length > 0 };
      },
      keepPreviousData: true,
    },
  );

  const filterByGroup = useMemo(() => {
    if (!groupId) return data;
    return filter(data, (favorite) => favorite["group.sys_id"] === groupId);
  }, [data, groupId]);

  const filteredData = useMemo(() => {
    if (searchTerm === "") return filterByGroup;
    const terms = searchTerm.split(" ");
    return filter(filterByGroup, (favorite) =>
      terms.every((term) =>
        [favorite.title.toLowerCase(), favorite["group.title"].toLowerCase()].some((string) =>
          string.includes(term.toLowerCase()),
        ),
      ),
    );
  }, [filterByGroup, searchTerm]);

  const orderedData = useMemo(() => {
    return orderBy(filteredData, ["group.title", (item) => Number(item["order"]), "title"], ["asc", "asc", "asc"]);
  }, [filteredData]);

  const groupedFavorites = useMemo(() => {
    return groupBy(
      filter(orderedData, (favorite) => favorite["group.sys_id"] != ""),
      (favorite) => favorite["group.sys_id"],
    );
  }, [orderedData]);

  const ungroupedFavorites = useMemo(() => {
    return filter(orderedData, (favorite) => favorite["group.title"] == "");
  }, [orderedData]);

  const onInstanceChange = (newValue: string) => {
    const aux = instances.find((instance) => instance.id === newValue);
    if (aux) {
      setSelectedInstance(aux);
      LocalStorage.setItem("selected-instance", JSON.stringify(aux));
    }
  };

  return (
    <List
      onSearchTextChange={setSearchTerm}
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown
          isLoading={isLoadingInstances}
          value={instanceId}
          tooltip="Select the instance you want to search in"
          onChange={(newValue) => {
            !isLoadingInstances && onInstanceChange(newValue);
          }}
        >
          <List.Dropdown.Section title="Instance Profiles">
            {instances.map((instance: Instance) => (
              <List.Dropdown.Item
                key={instance.id}
                title={instance.alias ? instance.alias : instance.name}
                value={instance.id}
                icon={{
                  source: instanceId == instance.id ? Icon.CheckCircle : Icon.Circle,
                  tintColor: instance.color,
                }}
              />
            ))}
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {selectedInstance ? (
        errorFetching ? (
          <List.EmptyView
            icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
            title="Could Not Fetch Results"
            description="Press ⏎ to refresh or try later again"
            actions={
              <ActionPanel>
                <Actions mutate={mutate} />
              </ActionPanel>
            }
          />
        ) : (
          <>
            {groupedFavorites &&
              (searchTerm == "" && groupId == "" ? (
                <List.Section
                  key={"groups"}
                  title="Groups"
                  subtitle={`${Object.keys(groupedFavorites).length} ${Object.keys(groupedFavorites).length > 1 ? "results" : "result"}`}
                >
                  {Object.keys(groupedFavorites).map((groupId) => {
                    const groupName = groupedFavorites[groupId][0]["group.title"];
                    return (
                      <List.Item
                        key={groupId}
                        title={groupName}
                        icon={{ source: Icon.Folder, tintColor: Color.Green }}
                        actions={
                          <ActionPanel>
                            <ActionPanel.Section title={groupName}>
                              <Action.Push
                                title="Browse"
                                icon={Icon.ChevronRight}
                                target={<Favorites groupId={groupId} />}
                              />
                            </ActionPanel.Section>
                            <Actions mutate={mutate} />
                          </ActionPanel>
                        }
                      />
                    );
                  })}
                </List.Section>
              ) : (
                Object.keys(groupedFavorites).map((groupId) => {
                  const groupName = groupedFavorites[groupId][0]["group.title"];
                  return (
                    <List.Section
                      key={groupId}
                      title={groupName}
                      subtitle={`${groupName.length} ${groupName.length > 1 ? "results" : "result"}`}
                    >
                      {groupedFavorites[groupId].map((favorite) => {
                        const url = favorite.url.startsWith("/")
                          ? `${instanceUrl}${favorite.url}`
                          : `${instanceUrl}/${favorite.url}`;
                        const table = favorite.url.split(".do")[0].replace("/", "");
                        const { icon: iconName, color: colorName } = getTableIconAndColor(table);

                        const icon: Action.Props["icon"] = {
                          source: Icon[iconName as keyof typeof Icon],
                          tintColor: Color[colorName as keyof typeof Color],
                        };

                        return (
                          <List.Item
                            key={favorite.sys_id}
                            title={favorite.title}
                            keywords={favorite["group.title"].split(" ")}
                            icon={icon}
                            actions={
                              <ActionPanel>
                                <ActionPanel.Section title={favorite.title}>
                                  <Action.OpenInBrowser
                                    title="Open in Servicenow"
                                    url={url}
                                    icon={{ source: "servicenow.svg" }}
                                  />
                                  <Action.CopyToClipboard
                                    title="Copy URL"
                                    content={url}
                                    shortcut={Keyboard.Shortcut.Common.CopyPath}
                                  />
                                </ActionPanel.Section>
                                <Actions mutate={mutate} />
                              </ActionPanel>
                            }
                          />
                        );
                      })}
                    </List.Section>
                  );
                })
              ))}
            {ungroupedFavorites && (
              <List.Section
                key={"ungrouped"}
                title="Ungrouped"
                subtitle={`${ungroupedFavorites.length} ${ungroupedFavorites.length > 1 ? "results" : "result"}`}
              >
                {ungroupedFavorites.map((favorite) => {
                  const url = favorite.url.startsWith("/")
                    ? `${instanceUrl}${favorite.url}`
                    : `${instanceUrl}/${favorite.url}`;
                  const table = favorite.url.split(".do")[0].replace("/", "");
                  const { icon: iconName, color: colorName } = getTableIconAndColor(table);

                  const icon: Action.Props["icon"] = {
                    source: Icon[iconName as keyof typeof Icon],
                    tintColor: Color[colorName as keyof typeof Color],
                  };

                  return (
                    <List.Item
                      key={favorite.sys_id}
                      title={favorite.title}
                      icon={icon}
                      actions={
                        <ActionPanel>
                          <ActionPanel.Section title={favorite.title}>
                            <Action.OpenInBrowser
                              title="Open in Servicenow"
                              url={url}
                              icon={{ source: "servicenow.svg" }}
                            />
                            <Action.CopyToClipboard
                              title="Copy URL"
                              content={url}
                              shortcut={Keyboard.Shortcut.Common.CopyPath}
                            />
                          </ActionPanel.Section>
                          <Actions mutate={mutate} />
                        </ActionPanel>
                      }
                    />
                  );
                })}
              </List.Section>
            )}
          </>
        )
      ) : (
        <List.EmptyView
          title="No Instance Profiles Found"
          description="Add an Instance Profile to get started"
          actions={
            <ActionPanel>
              <Action.Push
                title="Add Instance Profile"
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
