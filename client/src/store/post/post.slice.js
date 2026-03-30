import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../requestMethod";

// ─── Keys ─────────────────────────────────────────────
export const postKeys = {
  all: ["posts"],
  lists: () => [...postKeys.all, "list"],
  list: (filters) => [...postKeys.lists(), filters],
  detail: (postId) => [...postKeys.all, "detail", postId],
  byUser: (userId) => [...postKeys.all, "byUser", userId],
  feed: () => [...postKeys.all, "feed"],
  saved: () => [...postKeys.all, "saved"], // ✅ saved
};

// ─── API calls ────────────────────────────────────────
const getAllPosts = ({ pageParam = 1, limit = 10 }) =>
  axiosInstance.get("posts", { params: { page: pageParam, limit } });

const getPost = (postId) => axiosInstance.get(`posts/${postId}`);

const createPost = (body) => axiosInstance.post("posts", body);

const updatePost = ({ postId, body }) =>
  axiosInstance.put(`posts/${postId}`, body);

const deletePost = (postId) => axiosInstance.delete(`posts/${postId}`);

const getAllPostsByUserId = ({ userId, pageParam = 1, limit = 10 }) =>
  axiosInstance.get(`posts/user/${userId}`, {
    params: { page: pageParam, limit },
  });

const getFriendsPosts = ({ pageParam = 1, limit = 10 }) =>
  axiosInstance.get("posts/feed/friends", {
    params: { page: pageParam, limit },
  });

const getSavedPosts = ({ pageParam = 1, limit = 10 }) =>
  axiosInstance.get("posts/saved", {
    params: { page: pageParam, limit },
  });

const toggleLikePost = (postId) => axiosInstance.post(`posts/${postId}/like`);

const sharePost = (postId) => axiosInstance.post(`posts/${postId}/share`);

const toggleSavePost = (postId) => axiosInstance.post(`posts/${postId}/save`);

// ─── Fetch functions (for custom infinite scroll) ─────
export const fetchAllPostsFn = async ({ skip, take }) => {
  const page = Math.floor(skip / take) + 1;
  const { data } = await getAllPosts({ pageParam: page, limit: take });

  return {
    data: data.data.posts,
    total: data.data.meta.total,
  };
};

export const fetchFriendsPostsFn = async ({ skip, take }) => {
  const page = Math.floor(skip / take) + 1;
  const { data } = await getFriendsPosts({ pageParam: page, limit: take });

  return {
    data: data.data.posts,
    total: data.data.meta.total,
  };
};

export const fetchSavedPostsFn = async ({ skip, take }) => {
  const page = Math.floor(skip / take) + 1;
  const { data } = await getSavedPosts({ pageParam: page, limit: take });

  return {
    data: data.data.posts,
    total: data.data.meta.total,
  };
};

// ─── Hooks ────────────────────────────────────────────

// 🔹 All Posts
export const useGetAllPosts = (limit = 10) =>
  useInfiniteQuery({
    queryKey: postKeys.lists(),
    queryFn: ({ pageParam = 1 }) => getAllPosts({ pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const { page, totalPages } = data.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data.data.posts),
      meta: pages.at(-1).data.data.meta,
    }),
  });

// 🔹 Single Post
export const useGetPost = (postId) =>
  useQuery({
    queryKey: postKeys.detail(postId),
    queryFn: () => getPost(postId),
    select: ({ data }) => data.data,
    enabled: !!postId,
  });

// 🔹 Create
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    },
  });
};

// 🔹 Update
export const useUpdatePost = (postId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => updatePost({ postId, body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
};

// 🔹 Delete
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

// 🔹 Posts by User
export const useGetPostsByUser = (userId, limit = 10) =>
  useInfiniteQuery({
    queryKey: postKeys.byUser(userId),
    queryFn: ({ pageParam = 1 }) =>
      getAllPostsByUserId({ userId, pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const { page, totalPages } = data.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data.data.posts),
      meta: pages.at(-1).data.data.meta,
    }),
    enabled: !!userId,
  });

// 🔹 Friends Feed
export const useGetFriendsPosts = (limit = 10) =>
  useInfiniteQuery({
    queryKey: postKeys.feed(),
    queryFn: ({ pageParam = 1 }) => getFriendsPosts({ pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const { page, totalPages } = data.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data.data.posts),
      meta: pages.at(-1).data.data.meta,
    }),
  });

// 🔹 Saved Posts 🔥
export const useGetSavedPosts = (limit = 10) =>
  useInfiniteQuery({
    queryKey: postKeys.saved(),
    queryFn: ({ pageParam = 1 }) => getSavedPosts({ pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const { page, totalPages } = data.data.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data.data.posts),
      meta: pages.at(-1).data.data.meta,
    }),
  });

// 🔹 Like
export const useToggleLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleLikePost,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });
    },
  });
};

// 🔹 Share
export const useSharePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sharePost,
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
};

// 🔹 Save / Unsave 🔥🔥
export const useToggleSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleSavePost,

    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.feed() });

      // 🔥 أهم حاجة
      queryClient.invalidateQueries({ queryKey: postKeys.saved() });
    },
  });
};
