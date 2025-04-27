import { LaunchProps, LocalStorage, showToast, Toast, open } from "@raycast/api";
import { Instance } from "./types";

var forbiddenPrefixes = ["ts_", "sysx_", "v_", "sys_rollback_", "pa_"];

export default async (props: LaunchProps) => {
  const { sys_id } = props.arguments;
  const instance = await LocalStorage.getItem<string>("selected-instance");
  if (!instance) {
    showToast(Toast.Style.Failure, "No instances found", "Please create an instance profile first");
    return;
  }
  const instanceProfile = JSON.parse(instance) as Instance;

  const commonTables = ["sys_metadata", "task", "cmdb_ci", "sys_user", "kb_knowledge"];

  const toast = showToast(Toast.Style.Animated, "Searching sys_id...");
  try {
    for (const tableName of commonTables) {
      (await toast).message = tableName;
      const result = await callTableAPI(instanceProfile, `${tableName}?sys_id=${sys_id}&sysparm_fields=sys_id`);
      if (result) {
        await open(`https://${instanceProfile.name}.service-now.com/${tableName}.do?sys_id=${sys_id}`);
        return;
      }
    }

    const tables = await callTableAPI(
      instanceProfile,
      "sys_db_object?sysparm_fields=name&sysparm_query=super_class=NULL^sys_update_nameISNOTEMPTY^nameNOT LIKE00^nameNOT LIKE$^nameNOT INsys_metadata,task,cmdb_ci,sys_user,kb_knowledge,cmdb_ire_partial_payloads_index^scriptable_table=false^ORscriptable_tableISEMPTY",
    );
    for (const table of tables) {
      const tableName = table.name;
      var hasForbiddenPrefix = forbiddenPrefixes.some(function (forbiddenPrefix) {
        return tableName.startsWith(forbiddenPrefix);
      });
      if (!hasForbiddenPrefix) {
        (await toast).message = tableName;
        const result = await callTableAPI(instanceProfile, `${tableName}?sys_id=${sys_id}&sysparm_fields=sys_id`);
        if (result) {
          await open(`https://${instanceProfile.name}.service-now.com/${tableName}.do?sys_id=${sys_id}`);
          return;
        }
      }
    }
    showToast(Toast.Style.Failure, "Record not found", "The sys_id wasn't found");
  } catch (error) {
    showToast(Toast.Style.Failure, "Error", String(error));
  }
};

async function callTableAPI(instance: Instance, query: string) {
  const url = `https://${instance.name}.service-now.com/api/now/table/${query}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${Buffer.from(instance.username + ":" + instance.password).toString("base64")}`,
    },
  });

  const data = await response.json();
  if (data.result && data.result.length > 0) return data.result;
}
