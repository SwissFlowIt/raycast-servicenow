export function extractParamFromURL(urlString: string) {
  const url = new URL(urlString);
  let extractedParam = "";
  const queryParams = new URLSearchParams(url.search);
  const pathName = url.pathname;

  const paramSources = [
    { path: "_list.do", param: "sysparm_query" },
    { path: "$pa_dashboard.do", param: "sysparm_dashboard" },
    { path: "$vtb.do", param: "sysparm_board" },
    { path: "documate.do", param: (p: URLSearchParams) => `${p.get("w")}&${p.get("p")}` },
    {
      path: "system_properties_ui.do",
      param: (p: URLSearchParams) => `${p.get("sysparm_title")}&${p.get("sysparm_category")}`,
    },
  ];

  for (const { path: pathToMatch, param: getParam } of paramSources) {
    if (pathName.includes(pathToMatch)) {
      extractedParam = typeof getParam === "function" ? getParam(queryParams) : queryParams.get(getParam) || "";
      break;
    }
  }

  if (!extractedParam) {
    extractedParam = queryParams.get("sys_id") || queryParams.get("sysparm_query") || "";
  }

  return { path: pathName, param: extractedParam };
}
