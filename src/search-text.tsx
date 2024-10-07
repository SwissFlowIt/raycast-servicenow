/* eslint-disable @raycast/prefer-title-case */
import { ActionPanel, Action, Icon, List, Color, Detail } from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import axios from "axios";
import { filter } from "lodash";
import { useEffect, useState } from "react";
import { getPreferenceValues, showHUD, Clipboard } from "@raycast/api";

export default function Command() {
  const [showDetails, setShowDetails] = useCachedState("show-details", false);
  const [showPreview, setShowPreview] = useCachedState("show-preview", false);
  const [showRecordInformation, setShowRecordInformation] = useCachedState(
    "show-record-information",
    false
  );
  const [finishedLoading, setFinishedLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [result, setResult] = useState("");

  const preferences = getPreferenceValues<Preferences>();

  const instanceUrl = `https://${preferences.instance}.service-now.com`;

  useEffect(() => {
    const instance = axios.create({
      baseURL: `${instanceUrl}/api/now/`,
      auth: {
        username: preferences.username,
        password: preferences.password,
      },
    });

    const fetchRecords = async () => {
      instance
        .get(`globalsearch/search?sysparm_search=email`)
        .then((response) => {
          const results = filter(
            response.data.result.groups,
            (record) => record.result_count > 0
          );

          Clipboard.copy(JSON.stringify(results, null, "\t"));

          /* setResult(
            JSON.stringify(
              results.map((record) => record.search_results),
              null,
              "\t"
            )
          ); */
        })
        .catch((error) => {
          console.error("Error: ", error.response?.data || error.message);
        });
    };
    fetchRecords();
  }, []);

  return (
    <Detail
      markdown={`\`\`\`yaml
    ${result}
    \`\`\``}
    />
  );
}
