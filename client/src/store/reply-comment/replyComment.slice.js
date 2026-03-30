import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../requestMethod";

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const replyKeys = {
  all: ["replies"],
  byComment: (commentId) => [...replyKeys.all, "byComment", commentId],
};

// ─── API calls ────────────────────────────────────────────────────────────────
const getRepliesByComment = ({ commentId, pageParam = 1, limit = 10 }) =>
  axiosInstance.get(`replies/comment/${commentId}`, {
    params: { page: pageParam, limit },
  });

const createReply = ({ commentId, content }) =>
  axiosInstance.post(`replies/comment/${commentId}`, { commentId, content });

const deleteReply = (replyId) => axiosInstance.delete(`replies/${replyId}`);

const toggleLikeReply = (replyId) =>
  axiosInstance.post(`replies/${replyId}/like`);

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useGetRepliesByComment = (commentId, options = {}) =>
  useInfiniteQuery({
    queryKey: replyKeys.byComment(commentId),
    queryFn: ({ pageParam = 1 }) =>
      getRepliesByComment({ commentId, pageParam }),
    initialPageParam: 1,
    getNextPageParam: ({ data }) => {
      const meta = data?.data?.meta;
      if (!meta) return undefined;
      return meta.page < meta.totalPages ? meta.page + 1 : undefined;
    },
    select: ({ pages }) => ({
      items: pages.flatMap((p) => p.data?.data?.replies ?? []),
      meta: pages.at(-1)?.data?.data?.meta,
    }),
    enabled: !!commentId && options.enabled !== false,
  });

export const useCreateReply = (commentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReply,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: replyKeys.byComment(commentId),
      });
    },
  });
};

export const useDeleteReply = (commentId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReply,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: replyKeys.byComment(commentId),
      });
    },
  });
};

export const useToggleLikeReply = () => {
  return useMutation({ mutationFn: toggleLikeReply });
};
