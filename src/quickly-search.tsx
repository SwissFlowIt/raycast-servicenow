import { LaunchProps } from "@raycast/api";
import SearchResults from "./components/SearchResults";

export default function quicklySearch(props: LaunchProps) {
  const { query } = props.arguments;

  return <SearchResults searchTerm={query} />;
}
