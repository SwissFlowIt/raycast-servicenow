import { LaunchProps, LocalStorage, showToast, Toast, open } from "@raycast/api";
import { Instance } from "./types";
import { findSysID } from "./utils/snSnippets";

export default async (props: LaunchProps) => {
  const { sys_id } = props.arguments;
  const selectedInstance = await LocalStorage.getItem<string>("selected-instance");
  if (!selectedInstance) {
    showToast(Toast.Style.Failure, "No instances found", "Please create an instance profile first");
    return;
  }

  const instance = JSON.parse(selectedInstance) as Instance;

  showToast(Toast.Style.Animated, `Searching sys_id in ${instance.alias}...`);

  const client = new ServiceNowClient(instance);
  const isAuthenticated = await client.init();

  if (!isAuthenticated) {
    return;
  }

  const script = `${findSysID.toString()}
  findSysID("${sys_id}");`;

  const callBack = (response: string) => {
    const answer = response.match(/###(.*)###/);
    if (response.length == 0) showToast(Toast.Style.Failure, "Could not search for sys_id. (are you an Admin?)");
    else if (answer != null && answer[1]) {
      var table = answer[1].split("^")[0];
      var path = table + ".do?sys_id=" + sys_id;
      open(`https://${instance.name}.service-now.com/${path}`);
    } else {
      showToast(Toast.Style.Failure, `sys_id not found on ${instance.alias}`);
    }
  };

  await client.startBackgroundScript(script, callBack);
};

class ServiceNowClient {
  private instance: Instance;
  private sessionData: { ck: string; cookies: string } | null = null;

  constructor(instance: Instance) {
    this.instance = instance;
  }

  async init(): Promise<boolean> {
    this.sessionData = await this.authenticate();
    return this.sessionData !== null;
  }

  async authenticate() {
    const url = `https://${this.instance.name}.service-now.com/sn_devstudio_/v1/get_publish_info`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(this.instance.username + ":" + this.instance.password).toString("base64")}`,
        },
      });

      const data = await response.json();
      const cookies = response.headers.get("set-cookie");
      return { ck: data.ck, cookies: cookies || "" };
    } catch (error) {
      console.error("Authentication Failed:", error);
      showToast(
        Toast.Style.Failure,
        "Authentication Failed",
        "This command requires admin access in ServiceNow. Please verify your credentials and permissions.",
      );
      return null;
    }
  }

  async startBackgroundScript(script: string, callback: (data: string) => void) {
    if (!this.sessionData) throw new Error("Not authenticated");
    const url = `https://${this.instance.name}.service-now.com/sys.scripts.do`;

    const body = {
      script: script,
      runscript: "Run script",
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: this.sessionData.cookies,
          "X-UserToken": this.sessionData.ck,
        },
        body: new URLSearchParams(body).toString(),
      });

      const data = await response.text();
      callback(data);
    } catch (error) {
      console.error("Background Script failed:", error);
      showToast(Toast.Style.Failure, "Background Script failed");
    }
  }
}
