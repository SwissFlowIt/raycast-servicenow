import { Action, ActionPanel } from "@raycast/api";
import { Instance } from "../hooks/useInstances";

export default function ResultActions({
  instance,
  result,
  children,
}: {
  instance: Instance;
  result: any;
  children?: React.ReactNode;
}) {
  const instanceUrl = `https://${instance.name}.service-now.com`;

  return (
    <>
      <ActionPanel.Section title={result.metadata.title}>
        {children}
        <Action.OpenInBrowser
          title="Open in Browser"
          url={`${instanceUrl}${result.record_url}`}
        />
      </ActionPanel.Section>
      <ActionPanel.Section>
        <Action.CopyToClipboard
          title="Copy URL"
          content={`${instanceUrl}${result.record_url}`}
        />
        <Action.CopyToClipboard
          title="Copy Title"
          content={`${result.metadata.title}`}
        />
        {result.data.number && (
          <Action.CopyToClipboard
            title="Copy Number"
            content={result.data.number.display}
          />
        )}
      </ActionPanel.Section>
    </>
  );
}