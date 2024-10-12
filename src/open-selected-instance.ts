import { open, LocalStorage, showToast, Toast } from "@raycast/api";

export default async () => {
  const item = await LocalStorage.getItem<string>("selected-instance");
  if (!item){
    showToast(Toast.Style.Failure, "Instance not found", "Please create an instance profile first");
    return;
  }

  const parsedItem = JSON.parse(item);
  open(`https://${parsedItem.name}.service-now.com`);
};

