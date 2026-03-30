import React from "react";
import { useGetFollowers } from "../../../../store/user/user.slice";
import "./FolloweCard.scss";
/**
 * FollowersCard
 * Shows a compact sidebar card with the current user's followers.
 * Clicking "See all" should open the FollowModal from the Profile page.
 *
 * Props:
 *   onSeeAll - () => void  — passed from Profile to open the modal
 */
function FollowersCard({ onSeeAll }) {
  const { data, isLoading } = useGetFollowers(6);
  const followers = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="followers-card">
      <div className="followers-card__header">
        <h4 className="followers-card__title">Followers</h4>
        {total > 0 && (
          <button className="followers-card__see-all" onClick={onSeeAll}>
            See all ({total})
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="followers-card__skeletons">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="followers-card__skeleton" />
          ))}
        </div>
      ) : followers.length === 0 ? (
        <p className="followers-card__empty">No followers yet.</p>
      ) : (
        <div className="followers-card__list">
          {followers.slice(0, 6).map((user) => (
            <div key={user.id} className="followers-card__row">
              <img
                className="followers-card__avatar"
                src={
                  user.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${user.username}&background=random`
                }
                alt={user.username}
              />
              <div className="followers-card__info">
                <span className="followers-card__username">
                  {user.username}
                </span>
                {user.displayName && (
                  <span className="followers-card__display">
                    {user.displayName}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FollowersCard;
