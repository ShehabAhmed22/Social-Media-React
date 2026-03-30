import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";

// ─── 1. Create Story ──────────────────────────────────────────────────────────
export const createStory = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { mediaUrl, caption } = req.body;

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  try {
    const story = await prisma.story.create({
      data: { mediaUrl, caption, expiresAt, authorId: currentUserId },
      select: {
        id: true,
        mediaUrl: true,
        caption: true,
        expiresAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(new ApiResponse(201, story, "Story created"));
  } catch (error) {
    next(error);
  }
};

// ─── 2. Get All Friends Stories + My Own ─────────────────────────────────────
export const getFriendsStories = async (req, res, next) => {
  const currentUserId = req.user.id;
  const now = new Date();

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const friendIds = [currentUserId, ...following.map((f) => f.followingId)];

    const stories = await prisma.story.findMany({
      where: {
        authorId: { in: friendIds },
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        mediaUrl: true,
        caption: true,
        expiresAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    // Group by author
    const grouped = stories.reduce((acc, story) => {
      const authorId = story.author.id;
      if (!acc[authorId]) acc[authorId] = { author: story.author, stories: [] };
      acc[authorId].stories.push(story);
      return acc;
    }, {});

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { feed: Object.values(grouped) },
          "Stories feed fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 3. Create Story Comment ──────────────────────────────────────────────────
export const createStoryComment = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { storyId } = req.params;
  const { content } = req.body;

  try {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new ApiError(404, "Story not found");
    if (new Date() > story.expiresAt)
      throw new ApiError(410, "Story has expired");

    const comment = await prisma.storyComment.create({
      data: { content, authorId: currentUserId, storyId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.status(201).json(new ApiResponse(201, comment, "Story comment added"));
  } catch (error) {
    next(error);
  }
};

// ─── 4. Like / Unlike Story ───────────────────────────────────────────────────
export const toggleLikeStory = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { storyId } = req.params;

  try {
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new ApiError(404, "Story not found");
    if (new Date() > story.expiresAt)
      throw new ApiError(410, "Story has expired");

    const existing = await prisma.storyLike.findUnique({
      where: { userId_storyId: { userId: currentUserId, storyId } },
    });

    if (existing) {
      await prisma.storyLike.delete({
        where: { userId_storyId: { userId: currentUserId, storyId } },
      });
      return res.status(200).json(new ApiResponse(200, null, "Story unliked"));
    }

    await prisma.storyLike.create({ data: { userId: currentUserId, storyId } });

    res.status(201).json(new ApiResponse(201, null, "Story liked"));
  } catch (error) {
    next(error);
  }
};
