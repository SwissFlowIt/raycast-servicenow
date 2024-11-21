import { ActionPanel, Action, Form, Icon, useNavigation, Keyboard, confirmAlert, Alert } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { Favorite, FavoriteRecord } from "../types";
import useFavorites from "../hooks/useFavorites";

type SetInstanceFormProps = {
  favorite: Favorite;
  revalidate: () => void;
};

export default function FavoriteForm({ favorite, revalidate }: SetInstanceFormProps) {
  const { pop } = useNavigation();
  const { updateFavorite, updateFavoritesGroup, removeFromFavorites, favoritesGroups } = useFavorites();

  const { itemProps, handleSubmit } = useForm<FavoriteRecord>({
    onSubmit(values) {
      favorite.group
        ? updateFavoritesGroup({ ...values, sys_id: favorite.id }, revalidate)
        : updateFavorite({ ...values, sys_id: favorite.id }, revalidate);
      pop();
    },
    initialValues: {
      title: favorite.title,
      url: decodeURIComponent(favorite.url || ""),
      group: favorite.groupId,
    },
    validation: {
      title: FormValidation.Required,
      url: favorite.group ? undefined : FormValidation.Required,
    },
  });

  return (
    <Form
      navigationTitle={"Manage Favorites - Edit"}
      isLoading={false}
      actions={
        <ActionPanel>
          <ActionPanel.Section title={favorite.title}>
            <Action.SubmitForm onSubmit={handleSubmit} icon={Icon.SaveDocument} title={"Save"} />
            <Action
              title="Delete"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              onAction={() =>
                confirmAlert({
                  title: "Delete Favorite",
                  message: `Are you sure you want to delete "${favorite.title}"?`,
                  primaryAction: {
                    style: Alert.ActionStyle.Destructive,
                    title: "Delete",
                    onAction: () => {
                      removeFromFavorites(favorite.id, favorite.title, false, revalidate);
                      pop();
                    },
                  },
                })
              }
              shortcut={Keyboard.Shortcut.Common.Remove}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    >
      <Form.TextField {...itemProps.title} title="Name" placeholder="Enter the favorite name" />
      {!favorite.group && (
        <>
          <Form.TextArea {...itemProps.url} title="URL" placeholder="Enter the favorite URL" />
          <Form.Dropdown {...itemProps.group} title="Favorites Group">
            <Form.Dropdown.Item value="" title="--None--" />
            {favoritesGroups?.map((favoritesGroup) => (
              <Form.Dropdown.Item key={favoritesGroup.id} value={favoritesGroup.id} title={favoritesGroup.title} />
            ))}
          </Form.Dropdown>
        </>
      )}
    </Form>
  );
}
