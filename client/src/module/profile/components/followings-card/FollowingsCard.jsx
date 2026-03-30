import React from "react";
import {
  useGetFollowings,
  useToggleFollow,
} from "../../../../store/user/user.slice";
import "./FollowingsCard.scss";

function FollowingRow({ user }) {
  const toggle = useToggleFollow(user.id);

  return (
    <div className="followings-card__row">
      <img
        className="followings-card__avatar"
        src={
          user.avatarUrl ||
          `https://ui-avatars.com/api/?name=${user.username}&background=random`
        }
        alt={user.username}
      />
      <div className="followings-card__info">
        <span className="followings-card__username">{user.username}</span>
        {user.displayName && (
          <span className="followings-card__display">{user.displayName}</span>
        )}
      </div>
      <button
        className="followings-card__unfollow"
        onClick={() => toggle.mutate()}
        disabled={toggle.isPending}
      >
        {toggle.isPending ? "..." : "Unfollow"}
      </button>
    </div>
  );
}

/**
 * FollowingsCard
 * Shows a compact sidebar card with the current user's followings.
 *
 * Props:
 *   onSeeAll - () => void
 */
function FollowingsCard({ onSeeAll }) {
  const { data, isLoading } = useGetFollowings(6);
  const followings = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="followings-card">
      <div className="followings-card__header">
        <h4 className="followings-card__title">Following</h4>
        {total > 0 && (
          <button className="followings-card__see-all" onClick={onSeeAll}>
            See all ({total})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="followings-card__skeletons">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="followings-card__skeleton" />
          ))}
        </div>
      ) : followings.length === 0 ? (
        <p className="followings-card__empty">Not following anyone yet.</p>
      ) : (
        <div className="followings-card__list">
          {followings.slice(0, 6).map((user) => (
            <FollowingRow key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

export default FollowingsCard;
