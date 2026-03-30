/**?
 * 1. Create Comment
 * 2. Get ALL Comments (By PostID)
 * 3. Update Comment
 * 4. Delete Comment
 * 5. like / unlike comment

 */
import express from "express";
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  toggleLikeComment,
} from "../controller/comment.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/post/:postId", getCommentsByPost);

// ─── Protected ────────────────────────────────────────────────────────────────
router.post("/post/:postId", authenticate, createComment);
router.put("/:commentId", authenticate, updateComment);
router.delete("/:commentId", authenticate, deleteComment);

router.post("/:commentId/like", authenticate, toggleLikeComment);

export default router;
