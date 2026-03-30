/**
 * 1. get profileby (userID)
 * 2. update profile (userID)
 * 3. Get followers for a (current userID)
 * 4. Get followings for a (current userID)
 * 5. follow user // unfollow user
 * 6. get all suggest users with search for (current userID)
 */
import express from "express";
import {
  getProfile,
  updateProfile,
  getFollowers,
  getFollowings,
  toggleFollow,
  getSuggestedUsers,
} from "../controller/user.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/:userId/profile", getProfile);

// ─── Protected ────────────────────────────────────────────────────────────────
router.put("/:userId/profile", authenticate, updateProfile);

router.get("/me/followers", authenticate, getFollowers);
router.get("/me/followings", authenticate, getFollowings);

router.post("/:userId/follow", authenticate, toggleFollow);

router.get("/suggestions", authenticate, getSuggestedUsers);

export default router;
