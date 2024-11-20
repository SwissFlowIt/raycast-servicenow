import { useCallback, useMemo } from "react";

import { showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

import { Favorite, FavoritesResponse } from "../types";
import { extractParamFromURL } from "../utils/extractParamFromURL";
import useInstances from "./useInstances";

const useFavorites = () => {
  const { selectedInstance, userId } = useInstances();
  const { name: instanceName = "", username = "", password = "" } = selectedInstance || {};
  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { data: favorites, revalidate: revalidateFavorites } = useFetch(
    () => {
      return `${instanceUrl}/api/now/ui/favorite`;
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!selectedInstance,
      onError: (error) => {
        console.error(error);
        showToast(Toast.Style.Failure, "Could not fetch favorites", error.message);
      },

      mapResult(response: { result: FavoritesResponse }) {
        if (response && response.result && Object.keys(response.result).length === 0) {
          showToast(Toast.Style.Failure, "Could not fetch favorites");
          return { data: [] };
        }
        return { data: response.result.list };
      },
      keepPreviousData: true,
    },
  );

  const favoritesGroups = useMemo(() => {
    if (!favorites) return {};
    return Object.fromEntries(
      favorites.filter((favorite) => favorite.group).map((favorite) => [favorite.applicationId, favorite.id]),
    );
  }, [favorites]);

  const favoritesData = useMemo(() => {
    if (!favorites) return [];
    const urlsParams: { id: string; path: string; param: string }[] = [];

    const recursiveExtract = (favorites: Favorite[]) => {
      favorites.forEach((favorite) => {
        let favoriteURL = favorite.url;
        if (favoriteURL) {
          if (!favoriteURL.startsWith("/")) {
            favoriteURL = "/" + favoriteURL;
          }
          urlsParams.push({ ...extractParamFromURL(`${instanceUrl}${favoriteURL}`), id: favorite.id });
        }

        if (favorite.favorites) {
          recursiveExtract(favorite.favorites);
        }
      });
    };

    recursiveExtract(favorites);
    return urlsParams;
  }, [favorites]);

  const isMenuInFavorites = (groupId: string) => {
    return favoritesGroups[groupId];
  };

  const isUrlInFavorites = useCallback(
    (url: string) => {
      if (!favoritesData) return "";

      const menuURLData = extractParamFromURL(url);
      const favorite = favoritesData.find((favorite) => {
        return favorite.path == menuURLData.path && favorite.param == menuURLData.param;
      });
      return favorite?.id || "";
    },
    [favoritesData],
  );

  const addToFavorites = async (id: string, text: string, url: string, isGroup: boolean, mutate?: () => void) => {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: `Adding "${text}" to favorites`,
      });

      const [path, body] = isGroup
        ? [`/api/now/table/sys_ui_bookmark_group`, { application: id }]
        : [`/api/now/table/sys_ui_bookmark`, { module: id }];

      const response = await fetch(`${instanceUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body, title: text, user: userId, icon: "star", url }),
      });

      if (response.ok) {
        mutate ? mutate() : revalidateFavorites();

        await showToast({
          style: Toast.Style.Success,
          title: `${text} added to favorites`,
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed adding favorite",
          message: response.statusText,
        });
      }
    } catch (error) {
      console.error(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed adding favorite",
        message: error instanceof Error ? error.message : "",
      });
    }
  };

  const removeFromFavorites = async (id: string, title: string, isGroup: boolean, mutate?: () => void) => {
    try {
      await showToast({
        style: Toast.Style.Animated,
        title: `Removing "${title}" from favorites`,
      });

      const path = isGroup ? `/api/now/table/sys_ui_bookmark_group/${id}` : `/api/now/table/sys_ui_bookmark/${id}`;

      const response = await fetch(`${instanceUrl}${path}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
        },
      });

      if (response.ok) {
        mutate ? mutate() : revalidateFavorites();

        await showToast({
          style: Toast.Style.Success,
          title: `${title} removed from favorites`,
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed removing favorite",
          message: response.statusText,
        });
      }
    } catch (error) {
      console.error(error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed removing favorite",
        message: error instanceof Error ? error.message : "",
      });
    }
  };

  return { isUrlInFavorites, isMenuInFavorites, revalidateFavorites, addToFavorites, removeFromFavorites };
};

export default useFavorites;
