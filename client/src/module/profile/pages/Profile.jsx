import React, { useState, useContext, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DarkModeContext } from "../../../context/DarkMode";
import {
  useGetProfile,
  useGetFollowings,
  useToggleFollow,
} from "../../../store/user/user.slice";
import { useInfiniteScroll } from "../../../hooks/usePagination";
import FollowModal from "../components/follow-modal/FollowModal";
import EditProfileModal from "../components/edit-modal/EditModal";
import "./Profile.scss";

// helper – decode the JWT payload (no verify, client-side only)
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

const PostSkeleton = () => <div className="profile-post-skeleton" />;

function Profile() {
  const { darkMode } = useContext(DarkModeContext);
  const { userId } = useParams();
  const currentUser = getCurrentUserFromToken();
  const currentUserId = currentUser?.id ?? currentUser?.userId;
  const isOwner = currentUserId === userId;

  const [followModal, setFollowModal] = useState(null); // "followers" | "followings" | null
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "saved"

  const { data: profile, isLoading: profileLoading } = useGetProfile(userId);

  const { data: followingsData } = useGetFollowings(100);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    if (!followingsData?.items) return;
    const already = followingsData.items.some((u) => u.id === userId);
    setIsFollowing(already);
  }, [followingsData, userId]);

  const toggleFollowMutation = useToggleFollow(userId);
  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev);
    toggleFollowMutation.mutate(undefined, {
      onError: () => setIsFollowing((prev) => !prev),
    });
  };

  // ── Fetch functions for tabs ────────────────────────────────────────────────
  const fetchUserPostsFn = useCallback(
    async ({ skip, take }) => {
      const page = Math.floor(skip / take) + 1;
      const { default: axiosInstance } = await import("../../../requestMethod");
      const { data } = await axiosInstance.get(`posts/user/${userId}`, {
        params: { page, limit: take },
      });
      return { data: data.data.posts, total: data.data.meta.total };
    },
    [userId],
  );

  const fetchSavedPostsFn = useCallback(async ({ skip, take }) => {
    const page = Math.floor(skip / take) + 1;
    const { default: axiosInstance } = await import("../../../requestMethod");
    const { data } = await axiosInstance.get(`posts/saved`, {
      params: { page, limit: take },
    });
    return { data: data.data.posts, total: data.data.meta.total };
  }, []);

  const {
    items: posts,
    loading: postsLoading,
    reload: reloadPosts,
    sentinelRef: postsRef,
  } = useInfiniteScroll({ fetchFn: fetchUserPostsFn, limit: 9 });

  const {
    items: savedPosts,
    loading: savedLoading,
    reload: reloadSaved,
    sentinelRef: savedRef,
  } = useInfiniteScroll({ fetchFn: fetchSavedPostsFn, limit: 9 });

  // reload on tab change
  useEffect(() => {
    if (activeTab === "posts") reloadPosts();
    else reloadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userId]);

  if (profileLoading) {
    return (
      <div className={`profile-page ${darkMode ? "dark" : ""}`}>
        <div className="profile-skeleton">
          <div className="profile-skeleton__avatar" />
          <div className="profile-skeleton__lines">
            <div />
            <div />
            <div />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`profile-page ${darkMode ? "dark" : ""}`}>
        <p className="profile-not-found">User not found.</p>
      </div>
    );
  }

  return (
    <div className={`profile-page ${darkMode ? "dark" : ""}`}>
      {/* Header */}
      <div className="profile-header">
        <div
          className="profile-header__bg"
          style={
            profile.backgroundUrl
              ? { backgroundImage: `url(${profile.backgroundUrl})` }
              : {}
          }
        />
        <div className="profile-header__content">
          <div className="profile-avatar-wrap">
            <img
              className="profile-avatar"
              src={
                profile.avatarUrl ||
                `https://ui-avatars.com/api/?name=${profile.username}&background=random`
              }
              alt={profile.username}
            />
          </div>
          <div className="profile-info">
            <div className="profile-info__top">
              <h1 className="profile-username">{profile.username}</h1>
              <div className="profile-actions">
                {isOwner ? (
                  <button
                    className="btn btn--outline"
                    onClick={() => setEditOpen(true)}
                  >
                    Edit Profile
                  </button>
                ) : (
                  <button
                    className={`btn ${isFollowing ? "btn--outline" : "btn--primary"}`}
                    onClick={handleToggleFollow}
                    disabled={toggleFollowMutation.isPending}
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </button>
                )}
              </div>
            </div>
            <div className="profile-stats">
              <div className="profile-stat">
                <span className="profile-stat__num">
                  {profile._count?.posts ?? 0}
                </span>
                <span className="profile-stat__label">posts</span>
              </div>
              <button
                className="profile-stat profile-stat--btn"
                onClick={() => setFollowModal("followers")}
              >
                <span className="profile-stat__num">
                  {profile._count?.followers ?? 0}
                </span>
                <span className="profile-stat__label">followers</span>
              </button>
              <button
                className="profile-stat profile-stat--btn"
                onClick={() => setFollowModal("followings")}
              >
                <span className="profile-stat__num">
                  {profile._count?.following ?? 0}
                </span>
                <span className="profile-stat__label">following</span>
              </button>
            </div>
            <div className="profile-bio">
              {profile.displayName && (
                <p className="profile-bio__name">{profile.displayName}</p>
              )}
              {profile.bio && (
                <p className="profile-bio__text">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
        {isOwner && (
          <button
            className={`profile-tab ${activeTab === "saved" ? "active" : ""}`}
            onClick={() => setActiveTab("saved")}
          >
            Saved
          </button>
        )}
      </div>

      {/* Posts Grid */}
      <div className="profile-posts-section">
        <div className="profile-posts-grid">
          {activeTab === "posts"
            ? postsLoading && posts.length === 0
              ? Array.from({ length: 9 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))
              : posts.map((post) => (
                  <div key={post.id} className="profile-post-thumb">
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} alt="post" />
                    ) : (
                      <div className="profile-post-thumb__text">
                        {post.content}
                      </div>
                    )}
                  </div>
                ))
            : savedLoading && savedPosts.length === 0
              ? Array.from({ length: 9 }).map((_, i) => (
                  <PostSkeleton key={i} />
                ))
              : savedPosts.map((post) => (
                  <div key={post.id} className="profile-post-thumb">
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} alt="post" />
                    ) : (
                      <div className="profile-post-thumb__text">
                        {post.content}
                      </div>
                    )}
                  </div>
                ))}
        </div>
        <div
          ref={activeTab === "posts" ? postsRef : savedRef}
          className="profile-sentinel"
        >
          {(postsLoading && activeTab === "posts") ||
          (savedLoading && activeTab === "saved") ? (
            <span className="profile-spinner" />
          ) : null}
        </div>
      </div>

      {/* Modals */}
      {followModal && (
        <FollowModal type={followModal} onClose={() => setFollowModal(null)} />
      )}
      {editOpen && (
        <EditProfileModal
          profile={profile}
          userId={userId}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}

export default Profile;
