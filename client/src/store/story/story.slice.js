import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axiosInstance from "../../requestMethod";

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const storyKeys = {
  all: ["stories"],
  feed: () => [...storyKeys.all, "feed"],
};

// ─── API calls ────────────────────────────────────────────────────────────────
const getFriendsStories = () => axiosInstance.get("stories/feed");

// body: { mediaUrl, caption? }
const createStory = (body) => axiosInstance.post("stories", body);

// body: { content }
const createStoryComment = ({ storyId, body }) =>
  axiosInstance.post(`stories/${storyId}/comment`, body);

const toggleLikeStory = (storyId) =>
  axiosInstance.post(`stories/${storyId}/like`);

// ─── Hooks ────────────────────────────────────────────────────────────────────
export const useGetFriendsStories = () =>
  useInfiniteQuery({
    queryKey: storyKeys.feed(),
    queryFn: getFriendsStories,
    initialPageParam: 1,
    getNextPageParam: () => undefined, // no server-side pagination
    select: ({ pages }) => ({
      // Backend returns: { feed: [{ author, stories[] }] }
      feed: pages.flatMap((p) => p.data.data.feed),
    }),
  });

export const useCreateStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStory, // expects { mediaUrl, caption? }
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.feed() });
    },
  });
};

export const useCreateStoryComment = (storyId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body) => createStoryComment({ storyId, body }), // body: { content }
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.feed() });
    },
  });
};

export const useToggleLikeStory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLikeStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.feed() });
    },
  });
};
