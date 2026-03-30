import React, { useEffect, useRef } from "react";
import {
  useGetFollowers,
  useGetFollowings,
  useToggleFollow,
} from "../../../../store/user/user.slice";
import "./FollowModal.scss";

function UserRow({ user, onClose }) {
  const toggleFollow = useToggleFollow(user.id);

  return (
    <div className="follow-modal__row">
      <img
        className="follow-modal__avatar"
        src={
          user.avatarUrl ||
          `https://ui-avatars.com/api/?name=${user.username}&background=random`
        }
        alt={user.username}
      />
      <div className="follow-modal__info">
        <span className="follow-modal__username">{user.username}</span>
        {user.displayName && (
          <span className="follow-modal__display">{user.displayName}</span>
        )}
      </div>
      <button
        className="btn btn--outline follow-modal__btn"
        onClick={() => toggleFollow.mutate()}
        disabled={toggleFollow.isPending}
      >
        {toggleFollow.isPending ? "..." : "Unfollow"}
      </button>
    </div>
  );
}

function FollowerRow({ user }) {
  return (
    <div className="follow-modal__row">
      <img
        className="follow-modal__avatar"
        src={
          user.avatarUrl ||
          `https://ui-avatars.com/api/?name=${user.username}&background=random`
        }
        alt={user.username}
      />
      <div className="follow-modal__info">
        <span className="follow-modal__username">{user.username}</span>
        {user.displayName && (
          <span className="follow-modal__display">{user.displayName}</span>
        )}
      </div>
    </div>
  );
}

function FollowModal({ type, onClose }) {
  const overlayRef = useRef(null);

  const {
    data: followersData,
    fetchNextPage: fetchNextFollowers,
    hasNextPage: hasMoreFollowers,
    isFetchingNextPage: loadingMoreFollowers,
  } = useGetFollowers(15);

  const {
    data: followingsData,
    fetchNextPage: fetchNextFollowings,
    hasNextPage: hasMoreFollowings,
    isFetchingNextPage: loadingMoreFollowings,
  } = useGetFollowings(15);

  const isFollowers = type === "followers";
  const items = isFollowers
    ? (followersData?.items ?? [])
    : (followingsData?.items ?? []);
  const hasMore = isFollowers ? hasMoreFollowers : hasMoreFollowings;
  const loadingMore = isFollowers
    ? loadingMoreFollowers
    : loadingMoreFollowings;
  const fetchNext = isFollowers ? fetchNextFollowers : fetchNextFollowings;

  // Close on overlay click
  const handleOverlay = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="follow-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlay}
    >
      <div className="follow-modal">
        {/* Header */}
        <div className="follow-modal__header">
          <h3 className="follow-modal__title">
            {isFollowers ? "Followers" : "Following"}
          </h3>
          <button className="follow-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* List */}
        <div className="follow-modal__list">
          {items.length === 0 && (
            <p className="follow-modal__empty">
              {isFollowers ? "No followers yet." : "Not following anyone yet."}
            </p>
          )}

          {items.map((user) =>
            isFollowers ? (
              <FollowerRow key={user.id} user={user} />
            ) : (
              <UserRow key={user.id} user={user} onClose={onClose} />
            ),
          )}

          {hasMore && (
            <button
              className="follow-modal__load-more"
              onClick={fetchNext}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowModal;
