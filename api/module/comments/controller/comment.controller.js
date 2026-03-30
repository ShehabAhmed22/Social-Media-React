import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { Pagination } from "../../../utils/Pagination.js";

const COMMENT_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  _count: {
    select: { likes: true, replies: true },
  },
};

// ─── 1. Create Comment ────────────────────────────────────────────────────────
export const createComment = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new ApiError(404, "Post not found");

    const comment = await prisma.comment.create({
      data: { content, authorId: currentUserId, postId },
      select: COMMENT_SELECT,
    });

    res.status(201).json(new ApiResponse(201, comment, "Comment created"));
  } catch (error) {
    next(error);
  }
};

// ─── 2. Get All Comments By PostID ───────────────────────────────────────────
export const getCommentsByPost = async (req, res, next) => {
  const { postId } = req.params;
  const pagination = new Pagination(req.query);

  try {
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        select: COMMENT_SELECT,
      }),
      prisma.comment.count({ where: { postId } }),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { comments, meta: pagination.getMeta() },
          "Comments fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 3. Update Comment ────────────────────────────────────────────────────────
export const updateComment = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new ApiError(404, "Comment not found");
    if (comment.authorId !== currentUserId)
      throw new ApiError(403, "Forbidden");

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      select: COMMENT_SELECT,
    });

    res.status(200).json(new ApiResponse(200, updated, "Comment updated"));
  } catch (error) {
    next(error);
  }
};

// ─── 4. Delete Comment ────────────────────────────────────────────────────────
export const deleteComment = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { commentId } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new ApiError(404, "Comment not found");
    if (comment.authorId !== currentUserId)
      throw new ApiError(403, "Forbidden");

    await prisma.comment.delete({ where: { id: commentId } });

    res.status(200).json(new ApiResponse(200, null, "Comment deleted"));
  } catch (error) {
    next(error);
  }
};

// ─── 5. Like / Unlike Comment ─────────────────────────────────────────────────
export const toggleLikeComment = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { commentId } = req.params;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new ApiError(404, "Comment not found");

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: currentUserId, commentId } },
    });

    if (existing) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId: currentUserId, commentId } },
      });
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment unliked"));
    }

    await prisma.commentLike.create({
      data: { userId: currentUserId, commentId },
    });

    res.status(201).json(new ApiResponse(201, null, "Comment liked"));
  } catch (error) {
    next(error);
  }
};
