/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** ServiceNow instance - Just the instance identifier. Not the URL */
  "instance": string,
  /** User name -  */
  "username": string,
  /** Password -  */
  "password": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-text` command */
  export type SearchText = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-text` command */
  export type SearchText = {
  /** Text */
  "text": string
}
}



