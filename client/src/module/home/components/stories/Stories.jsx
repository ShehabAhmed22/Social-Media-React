import React, {
  useState,
  useRef,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { DarkModeContext } from "../../../../context/DarkMode";
import {
  useGetFriendsStories,
  useCreateStory,
  useCreateStoryComment,
  useToggleLikeStory,
} from "../../../../store/story/story.slice";
import upload from "../../../../upload"; // Cloudinary upload helper
import "./stories.scss";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STORY_DURATION = 5000;

const getInitial = (name = "") => (name ? name[0].toUpperCase() : "?");

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `${Math.floor(diff / 60)}د`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
  return `${Math.floor(diff / 86400)}ي`;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const StorySkel = () => (
  <div className="story-skel">
    <div className="story-skel__ring" />
    <div className="story-skel__name" />
  </div>
);

// ─── Create Story Modal ───────────────────────────────────────────────────────
const CreateStoryModal = ({ isOpen, onClose }) => {
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadingImg, setUploadingImg] = useState(false); // Cloudinary upload
  const [submitting, setSubmitting] = useState(false); // API call
  const fileRef = useRef(null);
  const createStory = useCreateStory();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleRemoveImg = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file && !caption.trim()) return;
    setSubmitting(true);
    try {
      let mediaUrl = "";

      if (file) {
        setUploadingImg(true);
        mediaUrl = await upload(file); // → Cloudinary URL string
        setUploadingImg(false);
      }

      // POST /stories — body: { mediaUrl, caption? }
      await createStory.mutateAsync({
        mediaUrl,
        ...(caption.trim() && { caption: caption.trim() }),
      });

      handleClose();
    } catch (err) {
      console.error("Failed to create story:", err);
      setUploadingImg(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCaption("");
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  };

  if (!isOpen) return null;

  const busy = uploadingImg || submitting;

  return (
    <div className="cs-overlay" onClick={handleClose}>
      <div className="cs-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cs-modal__header">
          <h3>إنشاء قصة</h3>
          <button onClick={handleClose} disabled={busy}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="cs-modal__body">
          {/* Drop zone */}
          <div
            className="cs-modal__drop"
            onClick={() => !preview && fileRef.current?.click()}
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" />
                {!busy && (
                  <button
                    className="cs-modal__remove-img"
                    onClick={handleRemoveImg}
                  >
                    ×
                  </button>
                )}
                {busy && (
                  <div className="cs-modal__uploading">
                    <span className="spin" />
                    <span>
                      {uploadingImg ? "جاري رفع الصورة..." : "جاري النشر..."}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="cs-modal__drop-hint">
                <svg
                  width="42"
                  height="42"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21,15 16,10 5,21" />
                </svg>
                <span>اضغط لاختيار صورة أو فيديو</span>
              </div>
            )}
          </div>

          {/* Caption */}
          <textarea
            placeholder="أضف تعليقاً على قصتك..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={busy}
          />
        </div>

        {/* Footer */}
        <div className="cs-modal__footer">
          <label htmlFor="cs-file-input">
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            صورة / فيديو
          </label>
          <input
            id="cs-file-input"
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
            disabled={busy}
          />

          <button
            onClick={handleSubmit}
            disabled={busy || (!file && !caption.trim())}
          >
            {busy ? (
              <>
                <span
                  className="spin"
                  style={{ width: 16, height: 16, borderWidth: 2 }}
                />{" "}
                جاري...
              </>
            ) : (
              "نشر القصة"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Story Viewer ─────────────────────────────────────────────────────────────
const StoryViewer = ({ feed, startIndex, onClose }) => {
  const [userIdx, setUserIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [comment, setComment] = useState("");
  const [localLikes, setLocalLikes] = useState({}); // { [storyId]: bool }
  const [localLikeCounts, setLocalLikeCounts] = useState({}); // { [storyId]: number }
  const [sendingComment, setSendingComment] = useState(false);
  const timerRef = useRef(null);
  const commentInputRef = useRef(null);

  const toggleLike = useToggleLikeStory();

  // ── Current data ──
  // Backend shape: { author: { id, username, displayName, avatarUrl }, stories: [] }
  const currentGroup = feed[userIdx];
  const stories = currentGroup?.stories ?? [];
  const author = currentGroup?.author ?? {};
  const currentStory = stories[storyIdx];
  const storyId = currentStory?.id;

  // Derived like state: prefer local override, else fall back to server data
  const isLiked = localLikes[storyId] ?? false;
  const likeCount =
    localLikeCounts[storyId] ?? currentStory?._count?.likes ?? 0;

  // Hook called with current storyId — changes when story changes
  const createComment = useCreateStoryComment(storyId);

  // ── Navigation ──
  const goNext = useCallback(() => {
    clearTimeout(timerRef.current);
    if (storyIdx < stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgressKey((k) => k + 1);
    } else if (userIdx < feed.length - 1) {
      setUserIdx((i) => i + 1);
      setStoryIdx(0);
      setProgressKey((k) => k + 1);
    } else {
      onClose();
    }
  }, [storyIdx, stories.length, userIdx, feed.length, onClose]);

  const goPrev = useCallback(() => {
    clearTimeout(timerRef.current);
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgressKey((k) => k + 1);
    } else if (userIdx > 0) {
      setUserIdx((i) => i - 1);
      setStoryIdx(0);
      setProgressKey((k) => k + 1);
    }
  }, [storyIdx, userIdx]);

  // ── Auto-advance timer ──
  useEffect(() => {
    timerRef.current = setTimeout(goNext, STORY_DURATION);
    return () => clearTimeout(timerRef.current);
  }, [userIdx, storyIdx, progressKey, goNext]);

  // Pause timer while comment input is focused
  const pauseTimer = () => clearTimeout(timerRef.current);
  const resumeTimer = () => {
    timerRef.current = setTimeout(goNext, STORY_DURATION);
  };

  // ── Like ──
  const handleLike = () => {
    if (!storyId) return;
    const prev = isLiked;
    setLocalLikes((l) => ({ ...l, [storyId]: !prev }));
    setLocalLikeCounts((c) => ({
      ...c,
      [storyId]:
        (c[storyId] ?? currentStory?._count?.likes ?? 0) + (prev ? -1 : 1),
    }));
    toggleLike.mutate(storyId);
  };

  // ── Comment ──
  const handleSendComment = async () => {
    if (!comment.trim() || !storyId || sendingComment) return;
    setSendingComment(true);
    try {
      await createComment.mutateAsync({ content: comment.trim() });
      setComment("");
      commentInputRef.current?.blur();
      resumeTimer();
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setSendingComment(false);
    }
  };

  const handleCommentKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  if (!currentGroup || !currentStory) return null;

  const displayName = author.displayName || author.username || "مجهول";

  return (
    <div className="sv-overlay" onClick={onClose}>
      <div className="sv" onClick={(e) => e.stopPropagation()}>
        {/* ── Progress bars ── */}
        <div className="sv__progress">
          {stories.map((_, i) => (
            <div key={i} className="sv__bar">
              <span
                className={
                  i < storyIdx ? "done" : i === storyIdx ? "active" : ""
                }
                key={i === storyIdx ? progressKey : `static-${i}`}
                style={{ "--dur": `${STORY_DURATION}ms` }}
              />
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div className="sv__header">
          {author.avatarUrl ? (
            <img className="sv__av" src={author.avatarUrl} alt={displayName} />
          ) : (
            <div className="sv__av-init">{getInitial(displayName)}</div>
          )}
          <div className="sv__meta">
            <strong>{displayName}</strong>
            <span>{timeAgo(currentStory.createdAt)}</span>
          </div>
          <button className="sv__close" onClick={onClose}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Media — field is `mediaUrl` from backend ── */}
        {currentStory.mediaUrl ? (
          <img className="sv__media" src={currentStory.mediaUrl} alt="" />
        ) : (
          <div className="sv__media-bg">✨</div>
        )}

        {/* Bottom gradient */}
        <div className="sv__gradient" />

        {/* ── Caption ── */}
        {currentStory.caption && (
          <p className="sv__caption">{currentStory.caption}</p>
        )}

        {/* ── Tap nav zones ── */}
        <div className="sv__nav sv__nav--prev" onClick={goPrev} />
        <div className="sv__nav sv__nav--next" onClick={goNext} />

        {/* ── Bottom: like + comment ── */}
        <div className="sv__bottom">
          {/* Like row */}
          <div className="sv__like-row">
            <button
              className={`sv__like-btn ${isLiked ? "sv__like-btn--liked" : ""}`}
              onClick={handleLike}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                  a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84
                  a5.5 5.5 0 0 0 0-7.78z"
                />
              </svg>
            </button>
            {likeCount > 0 && (
              <span className="sv__like-count">{likeCount} إعجاب</span>
            )}
          </div>

          {/* Comment row */}
          <div className="sv__comment-row">
            <input
              ref={commentInputRef}
              className="sv__comment-input"
              type="text"
              placeholder="أضف تعليقاً..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={handleCommentKeyDown}
              onFocus={pauseTimer}
              onBlur={() => comment === "" && resumeTimer()}
              maxLength={300}
            />
            <button
              className="sv__send-btn"
              onClick={handleSendComment}
              disabled={!comment.trim() || sendingComment}
            >
              {sendingComment ? (
                <span
                  className="spin"
                  style={{ width: 16, height: 16, borderWidth: 2 }}
                />
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Stories Component ───────────────────────────────────────────────────
function Stories() {
  const { darkMode } = useContext(DarkModeContext);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStart, setViewerStart] = useState(0);
  const trackRef = useRef(null);

  const { data, isLoading, refetch } = useGetFriendsStories();
  // Backend groups by author → [{ author, stories[] }]
  const feed = data?.feed ?? [];

  // Sentinel at end of horizontal strip → refetch on scroll-to-end
  const sentinelRef = useCallback(
    (node) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) refetch();
        },
        { root: trackRef.current, threshold: 0.5 },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [refetch],
  );

  const openViewer = (idx) => {
    setViewerStart(idx);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="stories-strip">
        <div className="stories-strip__track" ref={trackRef}>
          {/* ── Add Story bubble ── */}
          <div className="story-bubble" onClick={() => setCreateOpen(true)}>
            <div className="story-bubble__ring-wrap">
              <div className="story-bubble__ring story-bubble__ring--add">
                <div className="story-bubble__inner">
                  <span
                    className="story-bubble__initial"
                    style={{ fontSize: 28 }}
                  >
                    +
                  </span>
                </div>
              </div>
              <span className="story-bubble__plus">+</span>
            </div>
            <span className="story-bubble__name story-bubble__name--you">
              قصتك
            </span>
          </div>

          {/* ── Skeletons ── */}
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => <StorySkel key={i} />)}

          {/* ── Friend story bubbles ── */}
          {!isLoading &&
            feed.map((group, idx) => {
              // Backend: { author: { id, username, displayName, avatarUrl }, stories[] }
              const { author, stories } = group;
              const name = author.displayName || author.username || "مجهول";

              return (
                <div
                  key={author.id ?? idx}
                  className="story-bubble"
                  onClick={() => openViewer(idx)}
                >
                  <div className="story-bubble__ring-wrap">
                    <div className="story-bubble__ring">
                      <div className="story-bubble__inner">
                        {author.avatarUrl ? (
                          <img
                            className="story-bubble__avatar"
                            src={author.avatarUrl}
                            alt={name}
                          />
                        ) : (
                          <span className="story-bubble__initial">
                            {getInitial(name)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="story-bubble__name">{name}</span>
                </div>
              );
            })}

          {/* ── Sentinel ── */}
          {!isLoading && (
            <div
              ref={sentinelRef}
              className="story-bubble story-bubble--sentinel"
            />
          )}
        </div>
      </div>

      {/* ── Story Viewer ── */}
      {viewerOpen && feed.length > 0 && (
        <StoryViewer
          feed={feed}
          startIndex={viewerStart}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* ── Create Story Modal ── */}
      <CreateStoryModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}

export default Stories;
