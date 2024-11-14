import { useCallback, useMemo, useState } from "react";

import { Action, ActionPanel, Color, Icon, Keyboard, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useCachedState, useFetch } from "@raycast/utils";

import { NavigationMenuResponse, NavigationMenuEntry, NavigationHistoryResponse, Instance } from "../types";
import useInstances from "../hooks/useInstances";
import Actions from "./Actions";
import InstanceForm from "./InstanceForm";
import { getTableIconAndColor } from "../utils/getTableIconAndColor";
import { groupBy, orderBy } from "lodash";

export default function NavigationMenu() {
  const { instances, isLoading: isLoadingInstances, addInstance, mutate: mutateInstances } = useInstances();
  const [selectedInstance, setSelectedInstance] = useCachedState<Instance>("instance");
  const [errorFetching, setErrorFetching] = useState<boolean>(false);
  let separator = "";

  const { id: instanceId = "", name: instanceName = "", username = "", password = "" } = selectedInstance || {};

  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { isLoading, data, mutate } = useFetch(
    () => {
      return `${instanceUrl}/api/now/table/sys_app_module?sysparm_query=active=true^application.active=true&sysparm_fields=sys_id,title,name,filter,query,link_type,assessment,report,order,application.title,application.order&sysparm_exclude_reference_link=true`;
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
        setErrorFetching(false);

        return { data: response.result, hasMore: response.result.length > 0 };
      },
      keepPreviousData: true,
    },
  );

  const { data: favorites, mutate: mutateFavorites } = useFetch(
    () => {
      return `${instanceUrl}/api/now/table/sys_ui_bookmark?sysparm_query=userDYNAMIC90d1921e5f510100a9ad2572f2b477fe&sysparm_fields=url`;
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!selectedInstance,
      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch favorites", error.message);
      },

      mapResult(response: NavigationHistoryResponse) {
        setErrorFetching(false);

        return { data: response.result, hasMore: response.result.length > 0 };
      },
      keepPreviousData: true,
    },
  );

  const urlInFavorites = useCallback(
    (url: string) => {
      if (!favorites) return false;

      let favoriteParam = "";
      let urlParam = "";

      const fullURL = new URL(url);
      const urlParams = new URLSearchParams(fullURL.search);
      const urlPath = fullURL.pathname;

      return favorites.some((favorite) => {
        let favoriteURL = favorite.url;
        if (!favoriteURL.startsWith("/")) {
          favoriteURL = "/" + favoriteURL;
        }

        const favoriteFullURL = new URL(`https://${instanceName}.service-now.com${favoriteURL}`);
        const favoriteParams = new URLSearchParams(favoriteFullURL.search);
        const favoritePath = favoriteFullURL.pathname;

        if (favoritePath.includes("_list.do")) {
          favoriteParam = favoriteParams.get("sysparm_query") || "";
          urlParam = urlParams.get("sysparm_query") || "";
        } else if (favoritePath.includes("$pa_dashboard.do")) {
          favoriteParam = favoriteParams.get("sysparm_dashboard") || "";
          urlParam = urlParams.get("sysparm_dashboard") || "";
        } else if (favoritePath.includes("system_properties_ui.do")) {
          favoriteParam = favoriteParams.get("sysparm_title") + "&" + favoriteParams.get("sysparm_category") || "";
          urlParam = urlParams.get("sysparm_title") + "&" + urlParams.get("sysparm_category") || "";
        } else {
          favoriteParam = favoriteParams.get("sys_id") || favoriteParams.get("sysparm_query") || "";
          urlParam = urlParams.get("sys_id") || urlParams.get("sysparm_query") || "";
        }

        return favoritePath == urlPath && favoriteParam == urlParam;
      });
    },
    [favorites],
  );

  const sections = useMemo(() => {
    const orderedData = orderBy(
      data,
      [
        (item) => item["application.order"] != "",
        (item) => Number(item["application.order"]),
        "application.title",
        (item) => item.order != "",
        (item) => Number(item.order),
        "title",
      ],
      ["desc", "asc", "asc", "desc", "asc", "asc"],
    );
    return groupBy(orderedData, "application.title");
  }, [data]);

  const onInstanceChange = (newValue: string) => {
    const aux = instances.find((instance) => instance.id === newValue);
    if (aux) {
      setSelectedInstance(aux);
      LocalStorage.setItem("selected-instance", JSON.stringify(aux));
    }
  };

  const getUrl = (menu: NavigationMenuEntry) => {
    const type = menu.link_type;
    if (type == "LIST" || type == "") {
      return `${menu.name}_list.do?sysparm_query=${menu.filter || menu.query}`;
    }
    if (type == "DETAIL") {
      return `${menu.name}.do?sysparm_query=${menu.filter}`;
    }
    if (type == "DIRECT" || type == "MAP") {
      return `${menu.query.startsWith("/") ? menu.query.split("/")[1] : menu.query}`;
    }
    if (type == "NEW") {
      return `${menu.name}.do?sys_id=-1&sysparm_query=${menu.filter}`;
    }
    if (type == "SCRIPT") {
      return `sys.scripts.do?action=run_module&sys_id=${menu.sys_id}`;
    }
    if (type == "REPORT") {
      return `sys_report_template.do?jvar_report_id=${menu.report}`;
    }
    if (type == "ASSESSMENT") {
      return `assessment_take2.do?sysparm_assessable_type=${menu.assessment}`;
    }
  };

  return (
    <List
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
                <Actions
                  mutate={() => {
                    mutate();
                    mutateFavorites();
                  }}
                />
              </ActionPanel>
            }
          />
        ) : (
          Object.keys(sections).map((section) => {
            separator = "";
            return (
              <List.Section
                key={section}
                title={section}
                subtitle={`${sections[section].length} ${sections[section].length == 1 ? "result" : "results"}`}
              >
                {sections[section].map((menu) => {
                  if (menu.link_type == "SEPARATOR") {
                    separator = menu.title;
                    return;
                  }

                  const { icon: iconName, color: colorName } = getTableIconAndColor(menu.name);
                  const icon: Action.Props["icon"] = {
                    source: Icon[iconName as keyof typeof Icon],
                    tintColor: Color[colorName as keyof typeof Color],
                  };

                  const url = `${instanceUrl}/${getUrl(menu)}`;
                  const isFavorite = urlInFavorites(url);

                  const accessories: List.Item.Accessory[] = separator
                    ? [
                        {
                          tag: { value: separator },
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
                      key={menu.sys_id}
                      icon={icon}
                      title={menu.title}
                      accessories={accessories}
                      keywords={[
                        ...menu.title.split(" "),
                        ...menu["application.title"].split(" "),
                        ...separator.split(" "),
                      ]}
                      actions={
                        <ActionPanel>
                          <ActionPanel.Section title={menu.title}>
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
                          <Actions
                            mutate={() => {
                              mutate();
                              mutateFavorites();
                            }}
                          />
                        </ActionPanel>
                      }
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
