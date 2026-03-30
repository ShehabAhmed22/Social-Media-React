import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/apiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { Pagination } from "../../../utils/Pagination.js";

const POST_SELECT = {
  id: true,
  content: true,
  mediaUrl: true,
  createdAt: true,
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  _count: {
    select: { likes: true, comments: true, shares: true },
  },
};

// ─── 1. Create Post ───────────────────────────────────────────────────────────
export const createPost = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { content, mediaUrl } = req.body;

  try {
    const post = await prisma.post.create({
      data: { content, mediaUrl, authorId: currentUserId },
      select: POST_SELECT,
    });

    res.status(201).json(new ApiResponse(201, post, "Post created"));
  } catch (error) {
    next(error);
  }
};

// ─── 2. Get Single Post ───────────────────────────────────────────────────────
export const getPost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: POST_SELECT,
    });

    if (!post) throw new ApiError(404, "Post not found");

    res.status(200).json(new ApiResponse(200, post, "Post fetched"));
  } catch (error) {
    next(error);
  }
};

// ─── 3. Update Post ───────────────────────────────────────────────────────────
export const updatePost = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { postId } = req.params;
  const { content, mediaUrl } = req.body;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "Post not found");
    if (post.authorId !== currentUserId) throw new ApiError(403, "Forbidden");

    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(content !== undefined && { content }),
        ...(mediaUrl !== undefined && { mediaUrl }),
      },
      select: POST_SELECT,
    });

    res.status(200).json(new ApiResponse(200, updated, "Post updated"));
  } catch (error) {
    next(error);
  }
};

// ─── 4. Delete Post ───────────────────────────────────────────────────────────
export const deletePost = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "Post not found");
    if (post.authorId !== currentUserId) throw new ApiError(403, "Forbidden");

    await prisma.post.delete({ where: { id: postId } });

    res.status(200).json(new ApiResponse(200, null, "Post deleted"));
  } catch (error) {
    next(error);
  }
};

// ─── 5. Get All Posts ─────────────────────────────────────────────────────────
export const getAllPosts = async (req, res, next) => {
  const pagination = new Pagination(req.query);

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        select: POST_SELECT,
      }),
      prisma.post.count(),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { posts, meta: pagination.getMeta() },
          "Posts fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 6. Get All Posts By UserId ───────────────────────────────────────────────
export const getAllPostsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  const pagination = new Pagination(req.query);

  try {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: userId },
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        select: POST_SELECT,
      }),
      prisma.post.count({ where: { authorId: userId } }),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { posts, meta: pagination.getMeta() },
          "User posts fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 7. Get Friends Posts ─────────────────────────────────────────────────────
export const getFriendsPosts = async (req, res, next) => {
  const currentUserId = req.user.id;
  const pagination = new Pagination(req.query);

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const friendIds = [currentUserId, ...following.map((f) => f.followingId)];

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: { in: friendIds } },
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        select: POST_SELECT,
      }),
      prisma.post.count({ where: { authorId: { in: friendIds } } }),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { posts, meta: pagination.getMeta() },
          "Friends posts fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 8. Like / Unlike Post ────────────────────────────────────────────────────
export const toggleLikePost = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "Post not found");

    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: currentUserId, postId } },
    });

    if (existing) {
      await prisma.like.delete({
        where: { userId_postId: { userId: currentUserId, postId } },
      });
      return res.status(200).json(new ApiResponse(200, null, "Post unliked"));
    }

    await prisma.like.create({ data: { userId: currentUserId, postId } });

    res.status(201).json(new ApiResponse(201, null, "Post liked"));
  } catch (error) {
    next(error);
  }
};

// ─── 9. Share Post ────────────────────────────────────────────────────────────
export const sharePost = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "Post not found");

    const existing = await prisma.share.findUnique({
      where: { userId_postId: { userId: currentUserId, postId } },
    });

    if (existing) throw new ApiError(409, "Already shared this post");

    await prisma.share.create({ data: { userId: currentUserId, postId } });

    res.status(201).json(new ApiResponse(201, null, "Post shared"));
  } catch (error) {
    next(error);
  }
};

// ─── 10. Save / Unsave Post ───────────────────────────────────────────────────
export const toggleSavePost = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { postId } = req.params;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "Post not found");

    const existing = await prisma.savedPosts.findUnique({
      where: { userId_postId: { userId: currentUserId, postId } },
    });

    if (existing) {
      await prisma.savedPosts.delete({
        where: { userId_postId: { userId: currentUserId, postId } },
      });
      return res.status(200).json(new ApiResponse(200, null, "Post unsaved"));
    }

    await prisma.savedPosts.create({ data: { userId: currentUserId, postId } });

    res.status(201).json(new ApiResponse(201, null, "Post saved"));
  } catch (error) {
    next(error);
  }
};
export const getSavedPosts = async (req, res, next) => {
  const currentUserId = req.user.id;
  const pagination = new Pagination(req.query);

  try {
    const [saved, total] = await Promise.all([
      prisma.savedPosts.findMany({
        where: { userId: currentUserId },
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        include: {
          post: {
            select: POST_SELECT,
          },
        },
      }),

      prisma.savedPosts.count({
        where: { userId: currentUserId },
      }),
    ]);

    const posts = saved.map((s) => s.post);

    pagination.total = total;

    res.status(200).json(
      new ApiResponse(
        200,
        {
          posts,
          meta: pagination.getMeta(),
        },
        "Saved posts fetched",
      ),
    );
  } catch (error) {
    next(error);
  }
};
