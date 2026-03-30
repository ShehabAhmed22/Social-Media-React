import React, { useState, useCallback, useContext, useEffect } from "react";
import { DarkModeContext } from "../../../context/DarkMode";
import {
  useToggleFollow,
  fetchSuggestedUsersFn,
  fetchSuggestedUsersPageFn,
} from "../../../store/user/user.slice";
import { useSearch } from "../../../hooks/useSearch";
import { useInfiniteScroll } from "../../../hooks/usePagination";
import "./Search.scss";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitial = (name = "") => (name ? name[0].toUpperCase() : "?");

const formatCount = (n = 0) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const UserSkeleton = () => (
  <div className="user-skel">
    <div className="user-skel__avatar" />
    <div className="user-skel__lines">
      <div className="user-skel__line user-skel__line--wide" />
      <div className="user-skel__line user-skel__line--mid" />
      <div className="user-skel__line user-skel__line--slim" />
    </div>
    <div className="user-skel__btn" />
  </div>
);

// ─── User Card ────────────────────────────────────────────────────────────────
// Manages its own follow state locally so toggling is instant (optimistic).
const UserCard = ({ user }) => {
  const [followed, setFollowed] = useState(false);
  const toggleFollow = useToggleFollow(user.id);

  const handleFollow = async () => {
    const prev = followed;
    setFollowed(!prev); // optimistic
    try {
      await toggleFollow.mutateAsync();
    } catch {
      setFollowed(prev); // rollback on error
    }
  };

  const followerCount = user._count?.followers ?? 0;
  const displayName = user.displayName || user.username;

  return (
    <div className="user-card">
      {/* Avatar */}
      <div className="user-card__avatar-wrap">
        {user.avatarUrl ? (
          <img
            className="user-card__avatar"
            src={user.avatarUrl}
            alt={displayName}
          />
        ) : (
          <div className="user-card__avatar-init">
            {getInitial(displayName)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="user-card__info">
        <p className="user-card__name">{displayName}</p>
        <p className="user-card__username">@{user.username}</p>
        {followerCount > 0 && (
          <p className="user-card__followers">
            {formatCount(followerCount)} متابع
          </p>
        )}
      </div>

      {/* Follow / Unfollow button */}
      <button
        className={`user-card__follow-btn ${
          followed
            ? "user-card__follow-btn--unfollow"
            : "user-card__follow-btn--follow"
        }`}
        onClick={handleFollow}
        disabled={toggleFollow.isPending}
      >
        {toggleFollow.isPending
          ? "..."
          : followed
            ? "إلغاء المتابعة"
            : "متابعة"}
      </button>
    </div>
  );
};

// ─── Search Page ──────────────────────────────────────────────────────────────
function Search() {
  const { darkMode } = useContext(DarkModeContext);

  // ── useSearch: drives the debounced query + first-page results ──
  // fetchSuggestedUsersFn is exported from the slice (no axiosInstance here)
  const {
    inputProps,
    query,
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    clear,
    isReady,
    getMeta,
  } = useSearch({
    fetchFn: fetchSuggestedUsersFn,
    debounce: 400,
    minChars: 2,
    searchField: "search", // matches backend query param name
  });

  const { isEmpty } = getMeta();

  // ── useInfiniteScroll: drives the "browse all suggestions" mode (empty query) ──
  // When query is empty we show all suggested users with infinite scroll.
  // The fetchFn is a closure that captures the current query string.
  const browseFetchFn = useCallback(
    (prismaArgs) => fetchSuggestedUsersPageFn(prismaArgs, ""),
    [],
  );

  const {
    items: browseItems,
    loading: browseLoading,
    sentinelRef,
    reload: browseReload,
  } = useInfiniteScroll({ fetchFn: browseFetchFn, limit: 12 });

  // Load browse list on mount
  useEffect(() => {
    browseReload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Decide which data to show ──
  // - Active search (query ≥ 2 chars): show useSearch results
  // - No query: show infinite-scroll browse list
  const isSearching = isReady;
  const displayItems = isSearching ? searchResults : browseItems;
  const isLoading = isSearching ? searchLoading : browseLoading;

  return (
    <div className="search-page">
      {/* ── Search bar ── */}
      <div className="search-bar">
        <div className="search-bar__inner">
          <span className="search-bar__icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>

          <input
            className="search-bar__input"
            {...inputProps}
            placeholder="ابحث عن أشخاص..."
            autoComplete="off"
            spellCheck={false}
          />

          {isLoading && <div className="search-bar__spinner" />}

          {query && !isLoading && (
            <button className="search-bar__clear" onClick={clear}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Meta row ── */}
      {!isLoading && displayItems.length > 0 && (
        <div className="search-meta">
          <span className="search-meta__label">
            {isSearching ? `نتائج "${query}"` : "مقترح عليك"}
          </span>
          <span className="search-meta__count">{displayItems.length}</span>
        </div>
      )}

      {/* ── Skeleton (first load) ── */}
      {isLoading &&
        displayItems.length === 0 &&
        Array.from({ length: 6 }).map((_, i) => <UserSkeleton key={i} />)}

      {/* ── Results list ── */}
      {displayItems.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}

      {/* ── Infinite scroll sentinel (browse mode only) ── */}
      {!isSearching && !isLoading && (
        <div ref={sentinelRef} className="search-sentinel">
          {browseLoading && displayItems.length > 0 && (
            <div className="search-sentinel__spinner" />
          )}
        </div>
      )}

      {/* ── Hint: type to search ── */}
      {!isSearching && !browseLoading && displayItems.length === 0 && (
        <div className="search-hint">
          <span className="search-hint__icon">🔍</span>
          <p className="search-hint__text">ابحث عن أشخاص تعرفهم</p>
          <p className="search-hint__sub">اكتب اسماً أو اسم مستخدم</p>
        </div>
      )}

      {/* ── Empty search result ── */}
      {isSearching && isEmpty && !searchLoading && (
        <div className="search-empty">
          <span className="search-empty__icon">🕵️</span>
          <p className="search-empty__title">لا توجد نتائج</p>
          <p className="search-empty__sub">
            لم نجد أحداً بـ &quot;{query}&quot;
          </p>
        </div>
      )}

      {/* ── Error state ── */}
      {searchError && (
        <div className="search-empty">
          <span className="search-empty__icon">⚠️</span>
          <p className="search-empty__title">حدث خطأ</p>
          <p className="search-empty__sub">تعذّر تحميل النتائج، حاول مجدداً</p>
        </div>
      )}
    </div>
  );
}

export default Search;
