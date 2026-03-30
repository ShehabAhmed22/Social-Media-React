import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../requestMethod";

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const userKeys = {
  all: ["users"],
  profile: (userId) => [...userKeys.all, "profile", userId],
  followers: (userId) => [...userKeys.all, "followers", userId],
  followings: (userId) => [...userKeys.all, "followings", userId],
  suggestions: (search) => [...userKeys.all, "suggestions", search ?? ""],
};

// ─── API calls (private) ──────────────────────────────────────────────────────
const getProfile = (userId) => axiosInstance.get(`users/${userId}/profile`);

const updateProfile = ({ userId, body }) =>
  axiosInstance.put(`users/${userId}/profile`, body);

const getFollowers = ({ pageParam = 1, limit = 10 }) =>
  axiosInstance.get("users/me/followers", {
    params: { page: pageParam, limit },
  });

const getFollowings = ({ pageParam = 1, limit = 10 }) =>
  axiosInstance.get("users/me/followings", {
    params: { page: pageParam, limit },
  });

const toggleFollow = (userId) => axiosInstance.post(`users/${userId}/follow`);

const getSuggestedUsers = ({ pageParam = 1, limit = 10, search = "" }) =>
  axiosInstance.get("users/suggestions", {
    params: { page: pageParam, limit, search },
  });

// ─── Exported fetchFn for useSearch hook ─────────────────────────────────────
// useSearch passes { where: { search: { contains, mode } } } — we extract the
// search string and call the real API with { page: 1, limit, search }.
export const fetchSuggestedUsersFn = async (searchArgs, signal) => {
  const search = searchArgs?.where?.search?.contains ?? "";
  const { data } = await axiosInstance.get("users/suggestions", {
    params: { page: 1, limit: 20, search },
    signal, // AbortController signal from useSearch
  });
  return {
    data: data.data.users,
    total: data.data.meta.total,
  };
};

// ─── Exported fetchFn for useInfiniteScroll hook ──────────────────────────────
// useInfiniteScroll passes { skip, take } — convert to { page, limit }.
export const fetchSuggestedUsersPageFn = async (
  { skip, take },
  search = "",
) => {
  const page = Math.floor(skip / take) + 1;
  const { data } = await axiosInstance.get("users/suggestions", {
    params: { page, limit: take, search },
  });
  return {
    data: data.data.users,
    total: data.data.meta.total,
  };
};

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useGetProfile = (userId) =>
  useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: () => getProfile(userId),
    select: ({ data }) => data.data,
    enabled: !!userId,
  });

export const useUpdateProfile = (userId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => updateProfile({ userId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
    },
  });
};

export const useGetFollowers = (limit = 10) =>
  useInfiniteQuery({
    queryKey: userKeys.followers("me"),
    queryFn: ({ pageParam = 1 }) => getFollowers({ pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const { page, totalPages } = data.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data.data.followers),
      meta: pages.at(-1).data.data.meta,
    }),
  });

export const useGetFollowings = (limit = 10) =>
  useInfiniteQuery({
    queryKey: userKeys.followings("me"),
    queryFn: ({ pageParam = 1 }) => getFollowings({ pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const { page, totalPages } = data.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data.data.followings),
      meta: pages.at(-1).data.data.meta,
    }),
  });

export const useToggleFollow = (userId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => toggleFollow(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.followers("me") });
      queryClient.invalidateQueries({ queryKey: userKeys.followings("me") });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.suggestions() });
    },
  });
};

export const useGetSuggestedUsers = ({ search = "", limit = 10 } = {}) =>
  useInfiniteQuery({
    queryKey: userKeys.suggestions(search),
    queryFn: ({ pageParam = 1 }) =>
      getSuggestedUsers({ pageParam, limit, search }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const { page, totalPages } = data.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data.data.users),
      meta: pages.at(-1).data.data.meta,
    }),
  });
