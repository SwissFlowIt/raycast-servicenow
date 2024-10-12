/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `history` command */
  export type History = ExtensionPreferences & {}
  /** Preferences accessible in the `instances` command */
  export type Instances = ExtensionPreferences & {}
  /** Preferences accessible in the `quickly-search` command */
  export type QuicklySearch = ExtensionPreferences & {}
  /** Preferences accessible in the `quickly-search-selected-instance` command */
  export type QuicklySearchSelectedInstance = ExtensionPreferences & {}
  /** Preferences accessible in the `open-all-instances` command */
  export type OpenAllInstances = ExtensionPreferences & {}
  /** Preferences accessible in the `open-selected-instance` command */
  export type OpenSelectedInstance = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `history` command */
  export type History = {}
  /** Arguments passed to the `instances` command */
  export type Instances = {}
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
}



