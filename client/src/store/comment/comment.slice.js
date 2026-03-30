import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../requestMethod";

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const commentKeys = {
  all: ["comments"],
  byPost: (postId) => [...commentKeys.all, "byPost", postId],
  detail: (commentId) => [...commentKeys.all, "detail", commentId],
};

// ─── API calls ────────────────────────────────────────────────────────────────
const getCommentsByPost = ({ postId, pageParam = 1, limit = 10 }) =>
  axiosInstance.get(`comments/post/${postId}`, {
    params: { page: pageParam, limit },
  });

const createComment = ({ postId, content }) =>
  axiosInstance.post(`comments/post/${postId}`, { postId, content });

const updateComment = ({ commentId, content }) =>
  axiosInstance.put(`comments/${commentId}`, { content });

const deleteComment = (commentId) =>
  axiosInstance.delete(`comments/${commentId}`);

const toggleLikeComment = (commentId) =>
  axiosInstance.post(`comments/${commentId}/like`);

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useGetCommentsByPost = (postId, limit = 10) =>
  useInfiniteQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: ({ pageParam = 1 }) =>
      getCommentsByPost({ postId, pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const meta = data?.data?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data?.data?.comments ?? []),
      meta: pages.at(-1)?.data?.data?.meta,
    }),
    enabled: !!postId,
  });

export const useCreateComment = (postId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });
};

export const useUpdateComment = (postId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });
};

export const useDeleteComment = (postId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });
};

export const useToggleLikeComment = () => {
  return useMutation({ mutationFn: toggleLikeComment });
};
