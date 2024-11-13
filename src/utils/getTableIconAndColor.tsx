const tableIconColorMap = {
  incident: { icon: "ExclamationMark", color: "Red" },
  group: { icon: "TwoPeople", color: "Blue" },
  user: { icon: "Person", color: "Blue" },
  cmdb_ci: { icon: "HardDrive", color: "Orange" },
  pm_project: { icon: "Clipboard", color: "Purple" },
  change: { icon: "Cog", color: "Yellow" },
  problem: { icon: "Bug", color: "Magenta" },
  kb_knowledge: { icon: "Book", color: "Yellow" },
  cat_item: { icon: "Cart", color: "Green" },
  req_item: { icon: "Box", color: "Green" },
  request: { icon: "Envelope", color: "Green" },
  documate_page: { icon: "Document", color: "SecondaryText" },
};

export function getTableIconAndColor(tableName: string) {
  for (const key in tableIconColorMap) {
    if (tableName.includes(key)) {
      return tableIconColorMap[key as keyof typeof tableIconColorMap];
    }
  }
  return { icon: "Info", color: "SecondaryText" };
}
