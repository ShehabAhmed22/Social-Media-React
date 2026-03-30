/*
1. Create Post
2. Get Post
3. Update Post
4. Delete Post  
5. Get All Post
6. Get All Post By UserId
7. get all frinds post by (current userId)
8. create like / unlike  post 
9. share post
10. saved post 
*/
import express from "express";
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  getAllPosts,
  getAllPostsByUserId,
  getFriendsPosts,
  toggleLikePost,
  sharePost,
  toggleSavePost,
  getSavedPosts,
} from "../controller/post.controller.js";
import { authenticate } from "../../../middlewares/auth.middleware.js";

const router = express.Router();

// ─── Protected ────────────────────────────────────────────────────────────────
router.get("/feed/friends", authenticate, getFriendsPosts);

router.post("/", authenticate, createPost);
router.put("/:postId", authenticate, updatePost);
router.delete("/:postId", authenticate, deletePost);

router.post("/:postId/like", authenticate, toggleLikePost);
router.post("/:postId/share", authenticate, sharePost);
router.post("/:postId/save", authenticate, toggleSavePost);

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/", getAllPosts);
router.get("/user/:userId", getAllPostsByUserId);
router.get("/saved", authenticate, getSavedPosts);
router.get("/:postId", getPost);
export default router;
