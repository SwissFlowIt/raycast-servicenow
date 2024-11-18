import { useCallback, useMemo } from "react";

import { showToast, Toast } from "@raycast/api";
import { useFetch } from "@raycast/utils";

import { Favorite, FavoritesResponse, Instance } from "../types";
import { getParamFromURL } from "../utils/getParamFromURL";

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
        return { data: response.result.list };
      },
      keepPreviousData: true,
    },
  );

  function favoritesParams(favorites: Favorite[]) {
    const urlsParams: { table: string; filter: string }[] = [];

    const recursiveExtract = (favorites: Favorite[]) => {
      favorites.forEach((favorite) => {
        let favoriteURL = favorite.url;
        if (favoriteURL) {
          if (!favoriteURL?.startsWith("/")) {
            favoriteURL = "/" + favoriteURL;
          }
          urlsParams.push(getParamFromURL(`${instanceUrl}${favoriteURL}`));
        }

        if (favorite.favorites) {
          recursiveExtract(favorite.favorites);
        }
      });
    };

    recursiveExtract(favorites);
    return urlsParams;
  }

  const favoritesData = useMemo(() => {
    if (!favorites) return [];
    const result = favoritesParams(favorites);
    return result;
  }, [favorites]);

  /*   const favoritesData = useMemo(() => {
    return favorites?.map((favorite) => {
      let favoriteURL = favorite.url;
      if (!favoriteURL?.startsWith("/")) {
        favoriteURL = "/" + favoriteURL;
      }

      return getParamFromURL(`${instanceUrl}${favoriteURL}`);
    });
  }, [favorites]); */

  const isUrlInFavorites = useCallback(
    (url: string) => {
      if (!favoritesData) return false;

      const menuURLData = getParamFromURL(url);
      return favoritesData.some((favorite) => {
        return favorite.table == menuURLData.table && favorite.filter == menuURLData.filter;
      });
    },
    [favoritesData],
  );

  return { isUrlInFavorites, revalidateFavorites };
};

export default useFavorites;
