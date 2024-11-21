import { useMemo, useState } from "react";

import { Action, ActionPanel, Color, Icon, Keyboard, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

import { Favorite, FavoritesResponse, Instance } from "../types";
import useInstances from "../hooks/useInstances";
import Actions from "./Actions";
import InstanceForm from "./InstanceForm";
import { getTableIconAndColor } from "../utils/getTableIconAndColor";
import { filter } from "lodash";
import { getIconForModules } from "../utils/getIconForModules";
import useFavorites from "../hooks/useFavorites";

export default function Favorites(props: { groupId?: string; revalidate?: () => void }) {
  const { groupId = "", revalidate: revalidateParent } = props;
  const {
    instances,
    isLoading: isLoadingInstances,
    addInstance,
    mutate: mutateInstances,
    selectedInstance,
    setSelectedInstance,
  } = useInstances();
  const { removeFromFavorites } = useFavorites();
  const [errorFetching, setErrorFetching] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { id: instanceId = "", name: instanceName = "", username = "", password = "" } = selectedInstance || {};

  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { isLoading, data, revalidate } = useFetch(
    () => {
      return `${instanceUrl}/api/now/ui/favorite`;
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: selectedInstance && !groupId,
      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch favorites", error.message);
      },

      mapResult(response: { result: FavoritesResponse }) {
        if (response && response.result && Object.keys(response.result).length === 0) {
          setErrorFetching(true);
          showToast(Toast.Style.Failure, "Could not fetch favorites");
          return { data: [] };
        }

        setErrorFetching(false);
        return { data: response.result.list };
      },
      keepPreviousData: true,
    },
  );

  const filterByGroup = useMemo(() => {
    if (!groupId) return data;
    return filter(data, (favorite) => favorite.id === groupId);
  }, [data, groupId]);

  const numberOfFavoritesPerGroup = useMemo(() => {
    if (!data) return {};

    const result: { [key: string]: number } = {};

    const recursiveCount = (favorites: Favorite[]): number => {
      return favorites.reduce(
        (acc, favorite) =>
          acc + (favorite.favorites ? recursiveCount(favorite.favorites) : !favorite.separator ? 1 : 0),
        0,
      );
    };

    data.forEach((favorite) => {
      if (!favorite.group) return;
      result[favorite.id] = recursiveCount(favorite.favorites!);
    });

    return result;
  }, [data]);

  const recursiveFilter = (favorites: Favorite[], terms: string[], keywords: string[]): Favorite[] => {
    return favorites
      .map((favorite) => {
        const newKeywords = [...keywords, favorite.title.toLowerCase()];
        const matches = terms.every((term) => newKeywords.some((string) => string.includes(term.toLowerCase())));

        const filteredFavorites = favorite.favorites ? recursiveFilter(favorite.favorites, terms, newKeywords) : [];
        if (matches || filteredFavorites.length > 0) {
          return {
            ...favorite,
            favorites: filteredFavorites,
          };
        }
      })
      .filter((favorite) => favorite != undefined);
  };

  const filteredData = useMemo(() => {
    if (searchTerm === "") return filterByGroup;
    const terms = searchTerm.split(" ");

    return filterByGroup ? recursiveFilter(filterByGroup, terms, []) : [];
  }, [filterByGroup, searchTerm]);

  const groupedFavorites = useMemo(() => {
    return filter(filteredData, (favorite) => favorite.group);
  }, [filteredData]);

  const ungroupedFavorites = useMemo(() => {
    return filter(filteredData, (favorite) => !favorite.group);
  }, [filteredData]);

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
      searchBarPlaceholder="Filter by favorite, group, section"
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
                <Actions revalidate={revalidate} />
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
                  {groupedFavorites.map((group) => {
                    const groupName = group.title;
                    const numberOfFavorites = numberOfFavoritesPerGroup[group.id];
                    const accessories: List.Item.Accessory[] = numberOfFavorites
                      ? [
                          {
                            icon: getIconForModules(numberOfFavorites),
                            text: numberOfFavorites.toString(),
                            tooltip: `Favorites: ${numberOfFavorites}`,
                          },
                        ]
                      : [];
                    return (
                      <List.Item
                        key={group.id}
                        title={groupName}
                        accessories={accessories}
                        icon={{ source: Icon.Folder, tintColor: Color.Green }}
                        actions={
                          <ActionPanel>
                            <ActionPanel.Section title={groupName}>
                              <Action.Push
                                title="Browse"
                                icon={Icon.ChevronRight}
                                target={<Favorites groupId={group.id} revalidate={revalidate} />}
                              />
                              <Action
                                title="Delete"
                                icon={Icon.Trash}
                                style={Action.Style.Destructive}
                                onAction={() => removeFromFavorites(group.id, groupName, true, revalidate)}
                                shortcut={Keyboard.Shortcut.Common.Remove}
                              />
                            </ActionPanel.Section>
                            <Actions revalidate={revalidate} />
                          </ActionPanel>
                        }
                      />
                    );
                  })}
                </List.Section>
              ) : (
                groupedFavorites.map((group) => {
                  const groupName = group.title;
                  const numberOfFavorites = numberOfFavoritesPerGroup[group.id];

                  return (
                    <List.Section
                      key={group.id}
                      title={groupName}
                      subtitle={`${numberOfFavorites} ${numberOfFavorites > 1 ? "results" : "result"}`}
                    >
                      {group.favorites?.map((favorite) => {
                        return (
                          <FavoriteItem
                            key={favorite.id}
                            favorite={favorite}
                            instanceUrl={instanceUrl}
                            revalidate={() => {
                              revalidate();
                              revalidateParent?.();
                            }}
                            group={groupName}
                            removeFromFavorites={removeFromFavorites}
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
                {ungroupedFavorites.map((favorite) => (
                  <FavoriteItem
                    key={favorite.id}
                    favorite={favorite}
                    instanceUrl={instanceUrl}
                    revalidate={revalidate}
                    removeFromFavorites={removeFromFavorites}
                  />
                ))}
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

function FavoriteItem(props: {
  favorite: Favorite;
  instanceUrl: string;
  revalidate: () => void;
  group?: string;
  section?: string;
  removeFromFavorites: (id: string, title: string, isGroup: boolean, revalidate?: () => void) => void;
}) {
  const { favorite: favorite, instanceUrl, revalidate, removeFromFavorites, group = "", section = "" } = props;

  if (favorite.separator) {
    return favorite.favorites?.map((f) => {
      return (
        <FavoriteItem
          key={f.id}
          favorite={f}
          instanceUrl={instanceUrl}
          revalidate={revalidate}
          group={group}
          section={favorite.title}
          removeFromFavorites={props.removeFromFavorites}
        />
      );
    });
  }

  const url = favorite.url!.startsWith("/") ? `${instanceUrl}${favorite.url}` : `${instanceUrl}/${favorite.url}`;
  const { icon: iconName, color: colorName } = getTableIconAndColor(favorite.table || "");

  const icon: Action.Props["icon"] = {
    source: Icon[iconName as keyof typeof Icon],
    tintColor: Color[colorName as keyof typeof Color],
  };

  const accessories: List.Item.Accessory[] = section
    ? [
        {
          tag: { value: section },
          tooltip: `Section: ${section}`,
        },
      ]
    : [];

  return (
    <List.Item
      key={favorite.id}
      title={favorite.title}
      accessories={accessories}
      keywords={[...group.split(" "), ...section.split(" ")]}
      icon={icon}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={favorite.title}>
            <Action.OpenInBrowser title="Open in Servicenow" url={url} icon={{ source: "servicenow.svg" }} />
            <Action.CopyToClipboard title="Copy URL" content={url} shortcut={Keyboard.Shortcut.Common.CopyPath} />
            <Action
              title="Delete"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              onAction={() => removeFromFavorites(favorite.id, favorite.title, false, revalidate)}
              shortcut={Keyboard.Shortcut.Common.Remove}
            />
          </ActionPanel.Section>
          <Actions revalidate={revalidate} />
        </ActionPanel>
      }
    />
  );
}
