import React, { useState, useRef, useEffect } from "react";
import Comments from "../comments/Comments";
import {
  useToggleLikePost,
  useToggleSavePost,
  useSharePost,
  useDeletePost,
} from "../../../../store/post/post.slice";
import { useToggleFollow } from "../../../../store/user/user.slice";
import "./PostCard.scss";
import { NavLink } from "react-router-dom";

// ─── Get current user from JWT token ─────────────────────────────────────────
const getCurrentUserFromToken = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload; // { id, userId, username, … }
  } catch {
    return null;
  }
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "#ed4956" : "none"}
    stroke={filled ? "#ed4956" : "currentColor"}
    strokeWidth="2"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const SaveIcon = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);

const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ src, username, size = 32 }) => {
  const initials = username?.[0]?.toUpperCase() || "?";
  return src ? (
    <img
      src={src}
      alt={username}
      className="avatar-img"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
};

// ─── Format time ──────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString();
};

// ─── PostCard ─────────────────────────────────────────────────────────────────
function PostCard({ post, darkMode }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(post?._count?.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Optimistic follow state — seeded from the post data
  const [isFollowed, setIsFollowed] = useState(
    post.author?.isFollowed ?? false,
  );

  const dropdownRef = useRef(null);

  // ── Decode current user once from JWT ─────────────────────────────────────
  const currentUser = getCurrentUserFromToken();
  // JWT may store the id as `id` or `userId` depending on your backend
  const currentUserId = currentUser?.id ?? currentUser?.userId ?? null;

  // True when the logged-in user is the author of this post
  const isMyPost =
    currentUserId !== null && String(currentUserId) === String(post.author?.id);

  // ── Outside-click closes dropdown ─────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const likeMutation = useToggleLikePost();
  const saveMutation = useToggleSavePost();
  const shareMutation = useSharePost();
  const deleteMutation = useDeletePost();
  const followMutation = useToggleFollow(post.author?.id);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLike = () => {
    setLiked((v) => !v);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    likeMutation.mutate(post.id);
  };

  const handleSave = () => {
    setSaved((v) => !v);
    saveMutation.mutate(post.id);
  };

  const handleShare = () => shareMutation.mutate(post.id);

  const handleDoubleClick = () => {
    if (!liked) {
      setLiked(true);
      setLikesCount((c) => c + 1);
      likeMutation.mutate(post.id);
    }
  };

  const handleDelete = () => {
    setShowDropdown(false);
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(post.id);
    }
  };

  const handleToggleFollow = () => {
    // Optimistic update
    setIsFollowed((prev) => !prev);
    followMutation.mutate(undefined, {
      onError: () => {
        // Roll back if API fails
        setIsFollowed((prev) => !prev);
      },
    });
    setShowDropdown(false);
  };

  if (!post) return null;

  return (
    <article className={`post-card ${darkMode ? "dark" : ""}`}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="post-header">
        <div className="post-author">
          <div className="avatar-wrap">
            <Avatar
              src={post.author?.avatarUrl}
              username={post.author?.username}
              size={32}
            />
          </div>
          <div className="author-info">
            <NavLink
              to={`/profile/${post.author?.id}`}
              className="author-username"
            >
              {post.author?.username}
            </NavLink>
            <span className="post-time">{timeAgo(post.createdAt)}</span>
          </div>
        </div>

        {/* ── Three-dots menu ──────────────────────────────────────────────── */}
        <div className="header-actions" ref={dropdownRef}>
          <button
            className="more-btn"
            onClick={() => setShowDropdown((v) => !v)}
            aria-label="More options"
            aria-expanded={showDropdown}
          >
            <MoreIcon />
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              {isMyPost ? (
                /* ── My post: Delete only ────────────────────────────────── */
                <button
                  className="dropdown-item delete-btn"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting…" : "Delete"}
                </button>
              ) : (
                /* ── Someone else's post: Follow / Unfollow ─────────────── */
                <button
                  className={`dropdown-item ${isFollowed ? "unfollow-btn" : "follow-btn"}`}
                  onClick={handleToggleFollow}
                  disabled={followMutation.isPending}
                >
                  {followMutation.isPending
                    ? "…"
                    : isFollowed
                      ? "Unfollow"
                      : "Follow"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Image ──────────────────────────────────────────────────────────── */}
      {post.mediaUrl && !imgError && (
        <div className="post-media" onDoubleClick={handleDoubleClick}>
          <img
            src={post.mediaUrl}
            alt="post"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <div className="heart-burst" id={`heart-${post.id}`} />
        </div>
      )}

      {/* ── Action bar ─────────────────────────────────────────────────────── */}
      <div className="post-actions">
        <div className="actions-left">
          <button
            className={`action-btn like-btn ${liked ? "liked" : ""}`}
            onClick={handleLike}
          >
            <HeartIcon filled={liked} />
          </button>
          <button
            className="action-btn"
            onClick={() => setShowComments((v) => !v)}
          >
            <CommentIcon />
          </button>
          <button className="action-btn" onClick={handleShare}>
            <ShareIcon />
          </button>
        </div>
        <button
          className={`action-btn save-btn ${saved ? "saved" : ""}`}
          onClick={handleSave}
        >
          <SaveIcon filled={saved} />
        </button>
      </div>

      {/* ── Likes ──────────────────────────────────────────────────────────── */}
      {likesCount > 0 && (
        <div className="post-likes">
          {likesCount.toLocaleString()} {likesCount === 1 ? "like" : "likes"}
        </div>
      )}

      {/* ── Caption ────────────────────────────────────────────────────────── */}
      {post.content && (
        <div className="post-caption">
          <span className="caption-username">{post.author?.username}</span>
          <span className="caption-text"> {post.content}</span>
        </div>
      )}

      {/* ── View comments ──────────────────────────────────────────────────── */}
      {post._count?.comments > 0 && (
        <button
          className="view-comments-btn"
          onClick={() => setShowComments((v) => !v)}
        >
          View all {post._count.comments} comments
        </button>
      )}

      {/* ── Comments section ───────────────────────────────────────────────── */}
      {showComments && <Comments postId={post.id} darkMode={darkMode} />}
    </article>
  );
}

export default PostCard;
