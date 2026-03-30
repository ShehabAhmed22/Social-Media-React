/**?
 * 1. Create replyComment
 * 2. Get ALL replyComments (By commentID)
 * 3. Update replyComment
 * 4. Delete replyComment
 * 5. like / unlike replyComment
 */
import express from "express";
import {
  createReply,
  getRepliesByComment,
  updateReply,
  deleteReply,
  toggleLikeReply,
} from "../controller/reply-comment.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/comment/:commentId", getRepliesByComment);

// ─── Protected ────────────────────────────────────────────────────────────────
router.post("/comment/:commentId", authenticate, createReply);
router.put("/:replyId", authenticate, updateReply);
router.delete("/:replyId", authenticate, deleteReply);

router.post("/:replyId/like", authenticate, toggleLikeReply);

export default router;
