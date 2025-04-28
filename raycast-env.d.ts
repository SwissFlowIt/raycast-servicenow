/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Open content using - Select how you prefer to open ServiceNow pages and content (direct link, nav_to/Polaris, or SOW view). */
  "openMode": "direct" | "navigate" | "sow"
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search` command */
  export type Search = ExtensionPreferences & {}
  /** Preferences accessible in the `manage-instance-profiles` command */
  export type ManageInstanceProfiles = ExtensionPreferences & {}
  /** Preferences accessible in the `quickly-search` command */
  export type QuicklySearch = ExtensionPreferences & {}
  /** Preferences accessible in the `quickly-search-selected-instance` command */
  export type QuicklySearchSelectedInstance = ExtensionPreferences & {}
  /** Preferences accessible in the `open-all-instances` command */
  export type OpenAllInstances = ExtensionPreferences & {}
  /** Preferences accessible in the `open-selected-instance` command */
  export type OpenSelectedInstance = ExtensionPreferences & {}
  /** Preferences accessible in the `open-current-page-instance` command */
  export type OpenCurrentPageInstance = ExtensionPreferences & {}
  /** Preferences accessible in the `add-instance-profile` command */
  export type AddInstanceProfile = ExtensionPreferences & {}
  /** Preferences accessible in the `explore-tables` command */
  export type ExploreTables = ExtensionPreferences & {}
  /** Preferences accessible in the `search-resources` command */
  export type SearchResources = ExtensionPreferences & {}
  /** Preferences accessible in the `login-to-selected-instance` command */
  export type LoginToSelectedInstance = ExtensionPreferences & {}
  /** Preferences accessible in the `explore-navigation-history` command */
  export type ExploreNavigationHistory = ExtensionPreferences & {}
  /** Preferences accessible in the `explore-favorites` command */
  export type ExploreFavorites = ExtensionPreferences & {}
  /** Preferences accessible in the `explore-navigation-menu` command */
  export type ExploreNavigationMenu = ExtensionPreferences & {}
  /** Preferences accessible in the `search-sysid` command */
  export type SearchSysid = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search` command */
  export type Search = {}
  /** Arguments passed to the `manage-instance-profiles` command */
  export type ManageInstanceProfiles = {}
  /** Arguments passed to the `quickly-search` command */
  export type QuicklySearch = {
  /** Instance name or alias */
  "instanceName": string,
  /** Query */
  "query": string
}
  /** Arguments passed to the `quickly-search-selected-instance` command */
  export type QuicklySearchSelectedInstance = {
  /** Query */
  "query": string
}
  /** Arguments passed to the `open-all-instances` command */
  export type OpenAllInstances = {}
  /** Arguments passed to the `open-selected-instance` command */
  export type OpenSelectedInstance = {}
  /** Arguments passed to the `open-current-page-instance` command */
  export type OpenCurrentPageInstance = {
  /** Instance name or alias */
  "instanceName": string
}
  /** Arguments passed to the `add-instance-profile` command */
  export type AddInstanceProfile = {}
  /** Arguments passed to the `explore-tables` command */
  export type ExploreTables = {}
  /** Arguments passed to the `search-resources` command */
  export type SearchResources = {
  /** Query */
  "query": string
}
  /** Arguments passed to the `login-to-selected-instance` command */
  export type LoginToSelectedInstance = {}
  /** Arguments passed to the `explore-navigation-history` command */
  export type ExploreNavigationHistory = {}
  /** Arguments passed to the `explore-favorites` command */
  export type ExploreFavorites = {}
  /** Arguments passed to the `explore-navigation-menu` command */
  export type ExploreNavigationMenu = {}
  /** Arguments passed to the `search-sysid` command */
  export type SearchSysid = {
  /** sys_id */
  "sys_id": string
}
}

