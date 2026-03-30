import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { Pagination } from "../../../utils/Pagination.js";

const REPLY_SELECT = {
  id: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
  _count: {
    select: { likes: true },
  },
};

// ─── 1. Create Reply ──────────────────────────────────────────────────────────
export const createReply = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { commentId } = req.params;
  const { content } = req.body;

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new ApiError(404, "Comment not found");

    const reply = await prisma.reply.create({
      data: { content, authorId: currentUserId, commentId },
      select: REPLY_SELECT,
    });

    res.status(201).json(new ApiResponse(201, reply, "Reply created"));
  } catch (error) {
    next(error);
  }
};

// ─── 2. Get All Replies By CommentID ─────────────────────────────────────────
export const getRepliesByComment = async (req, res, next) => {
  const { commentId } = req.params;
  const pagination = new Pagination(req.query);

  try {
    const [replies, total] = await Promise.all([
      prisma.reply.findMany({
        where: { commentId },
        ...pagination.prismaArgs,
        orderBy: { createdAt: "asc" },
        select: REPLY_SELECT,
      }),
      prisma.reply.count({ where: { commentId } }),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { replies, meta: pagination.getMeta() },
          "Replies fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 3. Update Reply ──────────────────────────────────────────────────────────
export const updateReply = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { replyId } = req.params;
  const { content } = req.body;

  try {
    const reply = await prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) throw new ApiError(404, "Reply not found");
    if (reply.authorId !== currentUserId) throw new ApiError(403, "Forbidden");

    const updated = await prisma.reply.update({
      where: { id: replyId },
      data: { content },
      select: REPLY_SELECT,
    });

    res.status(200).json(new ApiResponse(200, updated, "Reply updated"));
  } catch (error) {
    next(error);
  }
};

// ─── 4. Delete Reply ──────────────────────────────────────────────────────────
export const deleteReply = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { replyId } = req.params;

  try {
    const reply = await prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) throw new ApiError(404, "Reply not found");
    if (reply.authorId !== currentUserId) throw new ApiError(403, "Forbidden");

    await prisma.reply.delete({ where: { id: replyId } });

    res.status(200).json(new ApiResponse(200, null, "Reply deleted"));
  } catch (error) {
    next(error);
  }
};

// ─── 5. Like / Unlike Reply ───────────────────────────────────────────────────
export const toggleLikeReply = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { replyId } = req.params;

  try {
    const reply = await prisma.reply.findUnique({ where: { id: replyId } });
    if (!reply) throw new ApiError(404, "Reply not found");

    const existing = await prisma.replyLike.findUnique({
      where: { userId_replyId: { userId: currentUserId, replyId } },
    });

    if (existing) {
      await prisma.replyLike.delete({
        where: { userId_replyId: { userId: currentUserId, replyId } },
      });
      return res.status(200).json(new ApiResponse(200, null, "Reply unliked"));
    }

    await prisma.replyLike.create({ data: { userId: currentUserId, replyId } });

    res.status(201).json(new ApiResponse(201, null, "Reply liked"));
  } catch (error) {
    next(error);
  }
};
