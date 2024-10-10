import { Color, Icon, List } from "@raycast/api";
import { getTableIconAndColor } from "../utils/getTableIconAndColor";

export default function TableDropdown(props: {
  tables: any[] | undefined;
  onTableTypeChange: (newValue: string) => void;
}) {
  const { tables = [], onTableTypeChange: onTableTypeChange } = props;

  return (
    <List.Dropdown
      tooltip="Select Table"
      storeValue={false}
      onChange={(newValue) => {
        onTableTypeChange(newValue);
      }}
    >
      <List.Dropdown.Item key="all" title="All" value="all" icon={Icon.Globe} />
      <List.Dropdown.Section title="Tables">
        {tables.map((table) => {
          const { icon, color } = getTableIconAndColor(table.name);

          return (
            <List.Dropdown.Item
              key={table.name}
              title={`${table.label_plural} (${table.record_count})`}
              value={table.name}
              icon={{
                source: Icon[icon as keyof typeof Icon],
                tintColor: Color[color as keyof typeof Color],
              }}
            />
          );
        })}
      </List.Dropdown.Section>
    </List.Dropdown>
  );
}
