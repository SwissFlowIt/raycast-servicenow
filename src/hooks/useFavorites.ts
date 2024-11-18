import { useCallback, useMemo } from "react";

import { showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

import { Favorite, FavoritesResponse, Instance } from "../types";
import { extractParamFromURL } from "../utils/extractParamFromURL";

/**
 * Hook to fetch and manage a user's favorites in ServiceNow.
 *
 * @param {Instance | undefined} instanceProfile The instance profile to fetch favorites for.
 * @returns {Object} An object containing the following properties:
 *   - isUrlInFavorites: A function that takes a URL and returns whether it is in the user's favorites.
 *   - revalidateFavorites: A function to revalidate the favorites.
 */
const useFavorites = (instanceProfile: Instance | undefined) => {
  const { name: instanceName = "", username = "", password = "" } = instanceProfile || {};
  const instanceUrl = `https://${instanceName}.service-now.com`;

  const { data: favorites, revalidate: revalidateFavorites } = useFetch(
    () => {
      return `${instanceUrl}/api/now/ui/favorite`;
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(username + ":" + password).toString("base64")}`,
      },
      execute: !!instanceProfile,
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

  const favoritesData = useMemo(() => {
    if (!favorites) return [];
    const urlsParams: { path: string; param: string }[] = [];

    const recursiveExtract = (favorites: Favorite[]) => {
      favorites.forEach((favorite) => {
        let favoriteURL = favorite.url;
        if (favoriteURL) {
          if (!favoriteURL.startsWith("/")) {
            favoriteURL = "/" + favoriteURL;
          }
          urlsParams.push(extractParamFromURL(`${instanceUrl}${favoriteURL}`));
        }

        if (favorite.favorites) {
          recursiveExtract(favorite.favorites);
        }
      });
    };

    recursiveExtract(favorites);
    return urlsParams;
  }, [favorites]);

  const isUrlInFavorites = useCallback(
    (url: string) => {
      if (!favoritesData) return false;

      const menuURLData = extractParamFromURL(url);
      return favoritesData.some((favorite) => {
        return favorite.path == menuURLData.path && favorite.param == menuURLData.param;
      });
    },
    [favoritesData],
  );

  return { isUrlInFavorites, revalidateFavorites };
};

export default useFavorites;
