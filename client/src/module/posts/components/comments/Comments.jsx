import React, { useState } from "react";
import ReplyComments from "../reply-comment/ReplyComments.jsx";
import {
  useGetCommentsByPost,
  useCreateComment,
  useToggleLikeComment,
  useDeleteComment,
} from "../../../../store/comment/comment.slice.js";
import "./comments.scss";

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "#ed4956" : "none"}
    stroke={filled ? "#ed4956" : "currentColor"}
    strokeWidth="2"
    width="12"
    height="12"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    width="20"
    height="20"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ src, username, size = 24 }) => {
  const initials = username?.[0]?.toUpperCase() || "?";
  return src ? (
    <img
      src={src}
      alt={username}
      className="c-avatar-img"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="c-avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </div>
  );
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

// ─── Single Comment ───────────────────────────────────────────────────────────
const CommentItem = ({ comment, postId, darkMode }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment._count?.likes ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);

  const likeMutation = useToggleLikeComment();
  const deleteMutation = useDeleteComment(postId);

  const handleLike = () => {
    setLiked((v) => !v);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    likeMutation.mutate(comment.id);
  };

  return (
    <div className="comment-item">
      <Avatar
        src={comment.author?.avatarUrl}
        username={comment.author?.username}
        size={28}
      />
      <div className="comment-body">
        <div className="comment-bubble">
          <span className="comment-username">{comment.author?.username}</span>
          <span className="comment-text">{comment.content}</span>
        </div>
        <div className="comment-meta">
          <span className="comment-time">{timeAgo(comment.createdAt)}</span>
          {likesCount > 0 && (
            <span className="comment-likes-count">{likesCount} likes</span>
          )}
          <button
            className="reply-trigger"
            onClick={() => setReplying((v) => !v)}
          >
            Reply
          </button>
        </div>

        {/* Replies toggle */}
        {comment._count?.replies > 0 && (
          <button
            className="view-replies-btn"
            onClick={() => setShowReplies((v) => !v)}
          >
            <span />
            {showReplies
              ? "Hide replies"
              : `View ${comment._count.replies} ${comment._count.replies === 1 ? "reply" : "replies"}`}
          </button>
        )}

        {showReplies && (
          <ReplyComments
            commentId={comment.id}
            darkMode={darkMode}
            showInput={replying}
            onCloseInput={() => setReplying(false)}
          />
        )}

        {replying && !showReplies && (
          <ReplyComments
            commentId={comment.id}
            darkMode={darkMode}
            showInput={true}
            onlyInput={true}
            onCloseInput={() => setReplying(false)}
          />
        )}
      </div>

      {/* Like button */}
      <button
        className={`comment-like-btn ${liked ? "liked" : ""}`}
        onClick={handleLike}
      >
        <HeartIcon filled={liked} />
      </button>
    </div>
  );
};

// ─── Comments ─────────────────────────────────────────────────────────────────
function Comments({ postId, darkMode }) {
  const [text, setText] = useState("");

  const { data, isLoading } = useGetCommentsByPost(postId);
  const createMutation = useCreateComment(postId);

  const comments = data?.items ?? data?.data?.data?.comments ?? [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    createMutation.mutate(
      { postId, content: text.trim() },
      { onSuccess: () => setText("") },
    );
  };

  return (
    <div className={`comments-section ${darkMode ? "dark" : ""}`}>
      {/* Comment list */}
      <div className="comments-list">
        {isLoading ? (
          <div className="comments-loading">
            {[1, 2].map((i) => (
              <div key={i} className="comment-skel">
                <div className="skel-circle" />
                <div className="skel-lines">
                  <div className="skel-line w70" />
                  <div className="skel-line w40" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              postId={postId}
              darkMode={darkMode}
            />
          ))
        )}
      </div>

      {/* Add comment */}
      <form className="add-comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="comment-input"
          maxLength={300}
        />
        <button
          type="submit"
          className="comment-submit"
          disabled={!text.trim() || createMutation.isPending}
        >
          {createMutation.isPending ? (
            <span className="mini-spinner" />
          ) : (
            <SendIcon />
          )}
        </button>
      </form>
    </div>
  );
}

export default Comments;
