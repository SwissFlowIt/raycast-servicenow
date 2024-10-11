import { ActionPanel, Color, Detail, Icon } from "@raycast/api";
import { format } from "date-fns";
import ResultActions from "./ResultActions";
import { Instance } from "../hooks/useInstances";
import { useCachedState } from "@raycast/utils";

export default function ResultDetail({
  result,
  fields,
}: {
  result: any;
  fields: any;
}) {
  const [instance] = useCachedState<Instance>("instance");

  const instanceUrl = `https://${instance?.name}.service-now.com`;

  const keysToCheck = [
    { key: "category", color: Color.Green },
    { key: "state", color: Color.Blue },
  ];

  let markdown = "";
  if (result.metadata.thumbnailURL)
    markdown += `![Illustration](${instanceUrl}/${result.metadata.thumbnailURL})\n\n`;

  markdown += `# ${result.metadata.title}\n\n`;
  markdown += `${result.metadata.description || ""}`;

  return (
    <Detail
      navigationTitle={`Text search > ${instance?.alias ? instance?.alias : instance?.name} > ${result.metadata.title}`}
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          {fields.map((field: any) => {
            if (field.name != "sys_id")
              switch (field.type) {
                case "glide_date":
                  return (
                    <Detail.Metadata.Label
                      key={field.name}
                      title={field.label}
                      text={
                        result.data[field.name]
                          ? format(
                              new Date(result.data[field.name]?.display),
                              "dd MMM yyyy"
                            )
                          : ""
                      }
                    />
                  );
                case "glide_date_time":
                  return (
                    <Detail.Metadata.Label
                      key={field.name}
                      title={field.label}
                      text={
                        result.data[field.name]
                          ? format(
                              new Date(result.data[field.name]?.display),
                              "dd MMM yyyy HH:mm"
                            )
                          : ""
                      }
                    />
                  );
                case "reference":
                  if (result.data[field.name].value)
                    return (
                      <Detail.Metadata.Link
                        key={field.name}
                        title={field.label}
                        text={result.data[field.name]?.display}
                        target={`${instanceUrl}/${field.reference}.do?sys_id=${result.data[field.name]?.value}`}
                      />
                    );
                default:
                  if (field.name.includes("category"))
                    return (
                      <Detail.Metadata.TagList
                        key={field.name}
                        title="Category"
                      >
                        <Detail.Metadata.TagList.Item
                          text={result.data[field.name]?.display}
                          color={Color.Green}
                        />
                      </Detail.Metadata.TagList>
                    );
                  else if (field.name.includes("state"))
                    return (
                      <Detail.Metadata.TagList key={field.name} title="State">
                        <Detail.Metadata.TagList.Item
                          text={result.data[field.name]?.display}
                          color={Color.Blue}
                        />
                      </Detail.Metadata.TagList>
                    );
                  else if (field.name.includes("priority"))
                    return (
                      <Detail.Metadata.Label
                        key={field.name}
                        title={field.label}
                        icon={
                          result.data[field.name]?.value < 3
                            ? {
                                source: Icon.Bell,
                                tintColor:
                                  result.data[field.name]?.value == 1
                                    ? Color.Red
                                    : Color.Orange,
                              }
                            : null
                        }
                        text={result.data[field.name]?.display}
                      />
                    );
                  else
                    return (
                      <Detail.Metadata.Label
                        key={field.name}
                        title={field.label}
                        text={result.data[field.name]?.display}
                      />
                    );
              }
          })}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <ResultActions result={result} />
        </ActionPanel>
      }
    />
  );
}
