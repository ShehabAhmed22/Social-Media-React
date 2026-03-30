import React, { useState, useEffect, useRef, useContext } from "react";
import PostCard from "../components/post-card/PostCard";
import { DarkModeContext } from "../../../context/DarkMode";
import {
  useCreatePost,
  fetchAllPostsFn,
  fetchFriendsPostsFn,
} from "../../../store/post/post.slice";
import { useInfiniteScroll } from "../../../hooks/usePagination";
import SuggestedUser from "../../suggested-user/pages/SuggestedUser";
import "./Posts.scss";
import upload from "../../../upload";
// ─── Skeleton ─────────────────────────────────────────────────

const PostSkeleton = () => (
  <div className="post-skeleton">
    <div style={{ display: "flex", gap: "10px", padding: "0 16px" }}>
      <div style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: "10px", width: "60%", marginBottom: "6px" }} />
        <div style={{ height: "10px", width: "40%" }} />
      </div>
    </div>
    <div style={{ width: "100%", aspectRatio: "1", marginTop: "12px" }} />
  </div>
);

// ─── Modal (كودك الأصلي مع الحفاظ على الكلاسات) ───────────────────
const CreatePostModal = ({ isOpen, onClose, onCreatePost, darkMode }) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setIsUploading(true);
    try {
      let mediaUrl = "";

      if (image) {
        setIsUploading(true);
        mediaUrl = await upload(image);
        setIsUploading(false);
      }

      await onCreatePost({ content, mediaUrl });
      setContent("");
      setImage(null);
      setImagePreview(null);
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="create-post-modal-overlay" onClick={onClose}>
      <div className="create-post-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">إنشاء منشور</h3>

        <textarea
          className="modal-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ماذا تريد أن تشارك اليوم؟"
        />

        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="preview" className="image-preview" />
            <button
              className="remove-image-btn"
              onClick={() => {
                setImage(null);
                setImagePreview(null);
              }}
            >
              ✕
            </button>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setImage(file);
              setImagePreview(URL.createObjectURL(file));
            }
          }}
          className="file-input"
        />

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={isUploading}
        >
          {isUploading ? "جاري النشر..." : "نشر"}
        </button>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────
function Posts() {
  const { darkMode } = useContext(DarkModeContext);
  const [feed, setFeed] = useState("all");
  const [openModal, setOpenModal] = useState(false);

  const createPostMutation = useCreatePost();
  const allScroll = useInfiniteScroll({ fetchFn: fetchAllPostsFn, limit: 8 });
  const friendsScroll = useInfiniteScroll({
    fetchFn: fetchFriendsPostsFn,
    limit: 8,
  });

  const scroll =
    feed === "friends" ? friendsScroll : feed === "all" ? allScroll : null;
  const {
    items: posts = [],
    loading,
    error,
    reload,
    sentinelRef,
  } = scroll || {};

  const isLoading = loading && posts.length === 0;
  const isFetchingMore = loading && posts.length > 0;

  useEffect(() => {
    allScroll.reload();
  }, []);

  const prevFeed = useRef(feed);
  useEffect(() => {
    if (prevFeed.current === feed) return;
    prevFeed.current = feed;
    if (feed !== "suggested") reload();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [feed, reload]);

  const handleCreatePost = async (postData) => {
    await createPostMutation.mutateAsync(postData);
    if (feed !== "suggested") reload();
  };

  return (
    <div className="posts-page">
      <header className="posts-tabs">
        <div className="tabs-container">
          <button
            className={`tab-btn ${feed === "friends" ? "active" : ""}`}
            onClick={() => setFeed("friends")}
          >
            Following
          </button>
          <button
            className={`tab-btn ${feed === "all" ? "active" : ""}`}
            onClick={() => setFeed("all")}
          >
            Explore
          </button>
          <button
            className={`tab-btn ${feed === "suggested" ? "active" : ""}`}
            onClick={() => setFeed("suggested")}
          >
            Suggested
          </button>
        </div>
      </header>

      <main key={feed} className="posts-feed fade">
        {feed === "suggested" ? (
          <SuggestedUser />
        ) : (
          <>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))
              : posts.map((post) => <PostCard key={post.id} post={post} />)}
            <div ref={sentinelRef} className="load-trigger">
              {isFetchingMore && (
                <div className="feed-spinner">
                  <span />
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <button className="create-post-fab" onClick={() => setOpenModal(true)}>
        +
      </button>
      <CreatePostModal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onCreatePost={handleCreatePost}
      />
    </div>
  );
}

export default Posts;
