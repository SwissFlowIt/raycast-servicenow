import { useMemo, useState } from "react";

import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { format } from "date-fns";

import { Action, ActionPanel, Color, Icon, Keyboard, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useCachedState, useFetch } from "@raycast/utils";

import { NavigationHistoryResponse, NavigationHistoryEntry, Instance } from "../types";
import useInstances from "../hooks/useInstances";
import Actions from "./Actions";
import InstanceForm from "./InstanceForm";
import { getTableIconAndColor } from "../utils/getTableIconAndColor";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

export default function NavigationHistory() {
  const { instances, isLoading: isLoadingInstances, addInstance, mutate: mutateInstances } = useInstances();
  const [selectedInstance, setSelectedInstance] = useCachedState<Instance>("instance");
  const [errorFetching, setErrorFetching] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { id: instanceId = "", name: instanceName = "", username = "", password = "" } = selectedInstance || {};

  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { isLoading, data, mutate, pagination } = useFetch(
    (options) => {
      const terms = searchTerm.split(" ");
      const query = terms.map((t) => `^titleLIKE${t}^ORdescriptionLIKE${t}^ORurlLIKE${t}`).join("");
      //return `${instanceUrl}/api/now/table/sys_ui_navigator_history?sysparm_display_value=true&sysparm_display_value=true&sysparm_exclude_reference_link=true&sysparm_query=${query}^ORDERBYlabel&sysparm_fields=name,label,super_class&sysparm_limit=100&sysparm_offset=${options.page * 100}`;
      return `${instanceUrl}/api/now/table/sys_ui_navigator_history?sysparm_query=${query}^userDYNAMIC90d1921e5f510100a9ad2572f2b477fe^ORDERBYDESCsys_created_on&sysparm_fields=title,description,url,sys_created_on,sys_id&sysparm_display_value=true&sysparm_limit=100&sysparm_offset=${options.page * 100}`;
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!selectedInstance,
      onError: (error) => {
        setErrorFetching(true);
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch navigation history", error.message);
      },

      mapResult(response: NavigationHistoryResponse) {
        setErrorFetching(false);

        return { data: response.result, hasMore: response.result.length > 0 };
      },
      keepPreviousData: true,
    },
  );

  const sections = useMemo(() => {
    const groupedSections: { [key: string]: NavigationHistoryEntry[] } = {};

    data?.forEach((historyEntry) => {
      const creationDate = new Date(historyEntry.sys_created_on);
      const relativeTime = timeAgo.format(creationDate);

      if (!groupedSections[relativeTime]) {
        groupedSections[relativeTime] = [];
      }
      groupedSections[relativeTime].push(historyEntry);
    });

    return groupedSections;
  }, [data]);

  const onInstanceChange = (newValue: string) => {
    const aux = instances.find((instance) => instance.id === newValue);
    if (aux) {
      setSelectedInstance(aux);
      LocalStorage.setItem("selected-instance", JSON.stringify(aux));
    }
  };

  return (
    <List
      searchText={searchTerm}
      onSearchTextChange={setSearchTerm}
      isLoading={isLoading}
      pagination={pagination}
      throttle
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
          Object.keys(sections).map((section) => (
            <List.Section key={section} title={section} subtitle={`${sections[section].length} results`}>
              {sections[section].map((historyEntry) => {
                const url = `${instanceUrl}/${historyEntry.url}`;
                const table = historyEntry.url.split(".do")[0];
                const { icon: iconName, color: colorName } = getTableIconAndColor(table);

                const icon: Action.Props["icon"] = {
                  source: Icon[iconName as keyof typeof Icon],
                  tintColor: Color[colorName as keyof typeof Color],
                };
                const accessories: List.Item.Accessory[] = [
                  {
                    icon: Icon.Clock,
                    tooltip: format(historyEntry.sys_created_on, "EEEE d MMMM yyyy 'at' HH:mm"),
                  },
                  {
                    icon: Icon.Link,
                    tooltip: historyEntry.url,
                  },
                ];

                return (
                  <List.Item
                    key={historyEntry.sys_id}
                    icon={icon}
                    title={historyEntry.title}
                    subtitle={historyEntry.description}
                    keywords={[historyEntry.title, historyEntry.description]}
                    accessories={accessories}
                    actions={
                      <ActionPanel>
                        <ActionPanel.Section
                          title={historyEntry.title + (historyEntry.description ? ": " + historyEntry.description : "")}
                        >
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
          ))
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
