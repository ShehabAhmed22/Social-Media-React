import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import prisma from "./lib/prisma.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import "./middlewares/story.cron.js";

import authRoutes from "./module/auth/routes/auth.routes.js";
import userRoutes from "./module/user/routes/user.routes.js";
import postRoutes from "./module/post/routes/post.routes.js";
import commentRoutes from "./module/comments/routes/comment.routes.js";
import replyRoutes from "./module/reply-comments/routes/reply-comment.routes.js";
import storyRoutes from "./module/story/routes/story.routes.js";

dotenv.config();

const app = express();

// ✅ CORS — must be before routes
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ✅ Parse JSON bodies
app.use(express.json());

// Test database connection
app.get("/", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ message: "Server and database connected successfully!" });
  } catch (error) {
    res.status(500).json({
      error: "Database connection failed",
      details: error.message,
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/replies", replyRoutes);
app.use("/api/stories", storyRoutes);

// 404 & Error middleware
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
