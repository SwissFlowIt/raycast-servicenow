import { Instance } from "../types";

/**
 * CREDIT: Snippets taken from the SN utils / arnoudkooi
 */
function snuStartBackgroundScript(script, callback) {
  try {
    fetch("sys.scripts.do", {
      method: "POST",
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        script: script,
        runscript: "Run script",
        sysparm_ck: g_ck,
        sys_scope: "e24e9692d7702100738dc0da9e6103dd",
        quota_managed_transaction: "on",
      }).toString(),
    })
      .then((response) => response.text())
      .then((data) => {
        callback(data);
      })
      .catch((error) => {
        snuSlashCommandInfoText("Background Script failed (" + error + ")<br />", true);
      });
  } catch (error) {
    snuSlashCommandInfoText("Background Script failed (" + error + ")<br />", true);
  }
}

async function getServiceNowToken(instance: Instance) {
  try {
    const response = await fetch(`https://${instance.name}.service-now.com/sn_devstudio_/v1/get_publish_info`, {
      headers: {
        Authorization: `Basic ${Buffer.from(instance.username + ":" + instance.password).toString("base64")}`,
      },
    });

    const data = await response.json();
    if (data.result && data.result.length > 0) return data.result;

    return response.data.ck;
  } catch (error) {
    console.error("Error getting ServiceNow token:", error);
    throw error;
  }
}
