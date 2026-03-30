/**?
 * 1. Create Story
 * 2. get All friends Stories and me
 *3 . create story comment
 *4 create story like/unlike
 5. delete story cron jop after 24 h
 */
import express from "express";
import {
  createStory,
  getFriendsStories,
  createStoryComment,
  toggleLikeStory,
} from "../controller/story.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

// ─── All Protected ────────────────────────────────────────────────────────────
router.post("/", authenticate, createStory);
router.get("/feed", authenticate, getFriendsStories);

router.post("/:storyId/comment", authenticate, createStoryComment);
router.post("/:storyId/like", authenticate, toggleLikeStory);

export default router;
