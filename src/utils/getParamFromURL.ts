export function getParamFromURL(urlString: string) {
  const url = new URL(urlString);
  let param = "";
  const params = new URLSearchParams(url.search);
  const path = url.pathname;

  if (path.includes("_list.do")) {
    param = params.get("sysparm_query") || "";
  } else if (path.includes("$pa_dashboard.do")) {
    param = params.get("sysparm_dashboard") || "";
  } else if (path.includes("system_properties_ui.do")) {
    param = params.get("sysparm_title") + "&" + params.get("sysparm_category") || "";
  } else {
    param = params.get("sys_id") || params.get("sysparm_query") || "";
  }

  return { table: path, filter: param };
}
