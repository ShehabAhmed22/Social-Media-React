import React, { useState } from "react";
import {
  useGetRepliesByComment,
  useCreateReply,
  useToggleLikeReply,
} from "../../../../store/reply-comment/replyComment.slice";
import "./replyComment.scss";

// ─── Icons ────────────────────────────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg
    viewBox="0 0 24 24"
    fill={filled ? "#ed4956" : "none"}
    stroke={filled ? "#ed4956" : "currentColor"}
    strokeWidth="2"
    width="11"
    height="11"
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
    width="16"
    height="16"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ src, username, size = 20 }) => {
  const initials = username?.[0]?.toUpperCase() || "?";
  return src ? (
    <img
      src={src}
      alt={username}
      className="r-avatar-img"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="r-avatar-fallback"
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

// ─── Single Reply ─────────────────────────────────────────────────────────────
const ReplyItem = ({ reply }) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(reply._count?.likes ?? 0);
  const likeMutation = useToggleLikeReply();

  const handleLike = () => {
    setLiked((v) => !v);
    setLikesCount((c) => (liked ? c - 1 : c + 1));
    likeMutation.mutate(reply.id);
  };

  return (
    <div className="reply-item">
      <Avatar
        src={reply.author?.avatarUrl}
        username={reply.author?.username}
        size={20}
      />
      <div className="reply-body">
        <div className="reply-bubble">
          <span className="reply-username">{reply.author?.username}</span>
          <span className="reply-text">{reply.content}</span>
        </div>
        <div className="reply-meta">
          <span className="reply-time">{timeAgo(reply.createdAt)}</span>
          {likesCount > 0 && (
            <span className="reply-likes-count">{likesCount} likes</span>
          )}
        </div>
      </div>
      <button
        className={`reply-like-btn ${liked ? "liked" : ""}`}
        onClick={handleLike}
      >
        <HeartIcon filled={liked} />
      </button>
    </div>
  );
};

// ─── ReplyComments ────────────────────────────────────────────────────────────
function ReplyComments({
  commentId,
  darkMode,
  showInput = false,
  onlyInput = false,
  onCloseInput,
}) {
  const [text, setText] = useState("");

  const { data, isLoading } = useGetRepliesByComment(commentId, {
    enabled: !onlyInput,
  });
  const createMutation = useCreateReply(commentId);

  const replies = data?.items ?? data?.data?.data?.replies ?? [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    createMutation.mutate(
      { commentId, content: text.trim() },
      {
        onSuccess: () => {
          setText("");
          onCloseInput?.();
        },
      },
    );
  };

  return (
    <div className={`reply-section ${darkMode ? "dark" : ""}`}>
      {/* Replies list */}
      {!onlyInput && (
        <div className="replies-list">
          {isLoading ? (
            <div className="reply-skel">
              <div className="skel-circle sm" />
              <div className="skel-line w60" />
            </div>
          ) : (
            replies.map((r) => <ReplyItem key={r.id} reply={r} />)
          )}
        </div>
      )}

      {/* Reply input */}
      {showInput && (
        <form className="add-reply-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reply..."
            className="reply-input"
            autoFocus
            maxLength={300}
          />
          <button
            type="submit"
            className="reply-submit"
            disabled={!text.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <span className="mini-spinner" />
            ) : (
              <SendIcon />
            )}
          </button>
          <button type="button" className="reply-cancel" onClick={onCloseInput}>
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

export default ReplyComments;
