import { useState } from "react";

import { Action, ActionPanel, Color, Icon, Keyboard, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useCachedState, useFetch } from "@raycast/utils";

import { NavigationMenuResponse, Instance, Module } from "../types";
import useInstances from "../hooks/useInstances";
import Actions from "./Actions";
import InstanceForm from "./InstanceForm";
import { getTableIconAndColor } from "../utils/getTableIconAndColor";
import useFavorites from "../hooks/useFavorites";

export default function NavigationMenu() {
  const { instances, isLoading: isLoadingInstances, addInstance, mutate: mutateInstances } = useInstances();
  const [selectedInstance, setSelectedInstance] = useCachedState<Instance>("instance");
  const { isUrlInFavorites, revalidateFavorites } = useFavorites(selectedInstance);
  const [errorFetching, setErrorFetching] = useState<boolean>(false);

  const { id: instanceId = "", name: instanceName = "", username = "", password = "" } = selectedInstance || {};

  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { isLoading, data, mutate } = useFetch(
    () => {
      return `${instanceUrl}/api/now/ui/navigator`;
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!selectedInstance,
      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch menu entries", error.message);
      },

      mapResult(response: NavigationMenuResponse) {
        if (response && response.result && response.result.length === 0) {
          setErrorFetching(true);
          showToast(Toast.Style.Failure, "Could not fetch favorites");
          return { data: [] };
        }
        setErrorFetching(false);
        return { data: response.result };
      },
      keepPreviousData: true,
    },
  );

  const onInstanceChange = (newValue: string) => {
    const aux = instances.find((instance) => instance.id === newValue);
    if (aux) {
      setSelectedInstance(aux);
      LocalStorage.setItem("selected-instance", JSON.stringify(aux));
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter by module, menu, section..."
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
                <Actions
                  mutate={() => {
                    mutate();
                    revalidateFavorites();
                  }}
                />
              </ActionPanel>
            }
          />
        ) : (
          data?.map((group) => {
            return (
              <List.Section
                key={group.id}
                title={group.title}
                subtitle={`${group.modules.length} ${group.modules.length == 1 ? "result" : "results"}`}
              >
                {group.modules.map((module) => {
                  if (module.type == "SEPARATOR" && module.modules) {
                    return module.modules.map((m) => {
                      const url = `${instanceUrl}${m.uri.startsWith("/") ? "" : "/"}${m.uri}`;
                      return (
                        <ModuleItem
                          key={m.id}
                          module={m}
                          url={url}
                          mutate={() => {
                            mutate();
                            revalidateFavorites();
                          }}
                          group={group.title}
                          section={module.title}
                          isFavorite={isUrlInFavorites(url)}
                        />
                      );
                    });
                  }
                  const url = `${instanceUrl}${module.uri.startsWith("/") ? "" : "/"}${module.uri}`;
                  return (
                    <ModuleItem
                      key={module.id}
                      module={module}
                      url={url}
                      mutate={() => {
                        mutate();
                        revalidateFavorites();
                      }}
                      group={group.title}
                      isFavorite={isUrlInFavorites(url)}
                    />
                  );
                })}
              </List.Section>
            );
          })
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

function ModuleItem(props: {
  module: Module;
  url: string;
  isFavorite: boolean;
  mutate: () => void;
  group: string;
  section?: string;
}) {
  const { module, url, isFavorite, mutate, group, section = "" } = props;
  const { icon: iconName, color: colorName } = getTableIconAndColor(module.tableName || "");
  const icon: Action.Props["icon"] = {
    source: Icon[iconName as keyof typeof Icon],
    tintColor: Color[colorName as keyof typeof Color],
  };

  const accessories: List.Item.Accessory[] = section
    ? [
        {
          tag: { value: section },
        },
      ]
    : [];

  if (isFavorite) {
    accessories.unshift({
      icon: { source: Icon.Star, tintColor: Color.Yellow },
      tooltip: "Favorite",
    });
  }
  return (
    <List.Item
      icon={icon}
      title={module.title}
      accessories={accessories}
      keywords={[...group.split(" "), ...section.split(" "), ...module.title.split(" ")]}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={module.title}>
            <Action.OpenInBrowser
              title="Open in Servicenow"
              url={decodeURIComponent(url)}
              icon={{ source: "servicenow.svg" }}
            />
            <Action.CopyToClipboard title="Copy URL" content={url} shortcut={Keyboard.Shortcut.Common.CopyPath} />
          </ActionPanel.Section>
          <Actions mutate={mutate} />
        </ActionPanel>
      }
    />
  );
}
