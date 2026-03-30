import express from "express";

import {
  register,
  login,
  refreshToken,
  logout,
} from "../controller/auth.controller.js";

import {
  loginLimiter,
  registerLimiter,
} from "../../../middlewares/rateLimiter.middleware.js";

import { authenticate } from "../../../middlewares/auth.middleware.js";

import {
  registerValidator,
  loginValidator,
} from "../../../validation/authValidator.js";

import { validate } from "../../../middlewares/validate.middleware.js";

const router = express.Router();

// Public
router.post(
  "/register",
  registerLimiter,
  validate(registerValidator),
  register,
);
router.post("/login", loginLimiter, validate(loginValidator), login);
// Protected
router.post("/refresh", authenticate, refreshToken);
router.post("/logout", authenticate, logout);

export default router;
