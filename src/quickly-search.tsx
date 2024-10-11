import { LaunchProps, environment } from "@raycast/api";
import SearchResults from "./components/SearchResults";

export default function quicklySearch(props: LaunchProps) {
  const { query } = props.arguments;
  const { commandName } = environment;

  return <SearchResults searchTerm={query} command={commandName} />;
}
