import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { Pagination } from "../../../utils/Pagination.js";

// ─── 1. Get Profile By UserID ─────────────────────────────────────────────────
export const getProfile = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        backgroundUrl: true,
        createdAt: true,
        _count: {
          select: { followers: true, following: true, posts: true },
        },
      },
    });

    if (!user) throw new ApiError(404, "User not found");

    res.status(200).json(new ApiResponse(200, user, "User profile fetched"));
  } catch (error) {
    next(error);
  }
};

// ─── 2. Update Profile ────────────────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { userId } = req.params;
  const { displayName, bio, avatarUrl, backgroundUrl, username } = req.body;

  try {
    if (currentUserId !== userId) {
      throw new ApiError(
        403,
        "Forbidden: you can only update your own profile",
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(backgroundUrl !== undefined && { backgroundUrl }),
        ...(username !== undefined && { username }),
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        backgroundUrl: true,
      },
    });

    res.status(200).json(new ApiResponse(200, updated, "Profile updated"));
  } catch (error) {
    if (error.code === "P2002")
      return next(new ApiError(409, "Username already taken"));
    next(error);
  }
};

// ─── 3. Get Followers ─────────────────────────────────────────────────────────
export const getFollowers = async (req, res, next) => {
  const currentUserId = req.user.id;
  const pagination = new Pagination(req.query);

  try {
    const [data, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: currentUserId },
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        select: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.follow.count({ where: { followingId: currentUserId } }),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            followers: data.map((f) => f.follower),
            meta: pagination.getMeta(),
          },
          "Followers fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 4. Get Followings ────────────────────────────────────────────────────────
export const getFollowings = async (req, res, next) => {
  const currentUserId = req.user.id;
  const pagination = new Pagination(req.query);

  try {
    const [data, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: currentUserId },
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        select: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.follow.count({ where: { followerId: currentUserId } }),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            followings: data.map((f) => f.following),
            meta: pagination.getMeta(),
          },
          "Followings fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ─── 5. Follow / Unfollow User ────────────────────────────────────────────────
export const toggleFollow = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { userId } = req.params;

  try {
    if (currentUserId === userId)
      throw new ApiError(400, "You cannot follow yourself");

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) throw new ApiError(404, "User not found");

    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId,
        },
      },
    });

    if (existing) {
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: userId,
          },
        },
      });
      return res
        .status(200)
        .json(new ApiResponse(200, null, "Unfollowed successfully"));
    }

    await prisma.follow.create({
      data: { followerId: currentUserId, followingId: userId },
    });

    res.status(201).json(new ApiResponse(201, null, "Followed successfully"));
  } catch (error) {
    next(error);
  }
};

// ─── 6. Get Suggested Users (with Search) ────────────────────────────────────
export const getSuggestedUsers = async (req, res, next) => {
  const currentUserId = req.user.id;
  const { search = "" } = req.query;
  const pagination = new Pagination(req.query);

  try {
    const alreadyFollowing = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const excludedIds = [
      currentUserId,
      ...alreadyFollowing.map((f) => f.followingId),
    ];

    const whereClause = {
      id: { notIn: excludedIds },
      OR: [
        { username: { contains: search } },
        { displayName: { contains: search } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        ...pagination.prismaArgs,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          _count: { select: { followers: true } },
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    pagination.total = total;

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { users, meta: pagination.getMeta() },
          "Suggested users fetched",
        ),
      );
  } catch (error) {
    next(error);
  }
};
