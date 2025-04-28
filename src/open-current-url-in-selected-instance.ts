import { LocalStorage, showToast, Toast, open } from "@raycast/api";
import { Instance } from "./types";
import { getURL } from "./utils/browserScripts";

export default async () => {
  const url = await getURL();

  if (!url) {
    showToast(Toast.Style.Failure, "No URL found", "Please open a tab in a supported browser");
    return;
  }

  const instance = await LocalStorage.getItem<string>("selected-instance");

  if (!instance) {
    showToast(Toast.Style.Failure, "No instances found", "Please create an instance profile first");
    return;
  }

  const instanceProfile = JSON.parse(instance) as Instance;

  if (url.includes(".service-now.com")) {
    const urlObject = new URL(url);
    open(`https://${instance.name}.service-now.com${urlObject.pathname + urlObject.search}`);
  } else {
    showToast(Toast.Style.Failure, "The current tab is not a ServiceNow instance");
  }
};
