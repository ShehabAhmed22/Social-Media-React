import { useState, useCallback, useRef } from "react";

/**
 * useInfiniteScroll
 *
 * A global-ready hook that mirrors the Pagination class API.
 *
 * @param {object} options
 * @param {Function} options.fetchFn   - async (prismaArgs) => { data: [], total: number }
 * @param {number}  [options.limit=10] - items per page (capped at 100)
 * @param {number}  [options.initialPage=1]
 */
export function useInfiniteScroll({
  fetchFn,
  limit = 10,
  initialPage = 1,
} = {}) {
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(Math.max(1, parseInt(initialPage)));
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const totalPages = Math.ceil(total / safeLimit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Mirrors Pagination.prismaArgs
  const getPrismaArgs = useCallback(
    (targetPage = page) => ({
      skip: (Math.max(1, targetPage) - 1) * safeLimit,
      take: safeLimit,
    }),
    [page, safeLimit],
  );

  // Mirrors Pagination.getMeta()
  const getMeta = useCallback(
    () => ({
      total,
      page,
      limit: safeLimit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    }),
    [total, page, safeLimit, totalPages, hasNextPage, hasPrevPage],
  );

  // Ref to avoid stale-closure issues in the observer callback
  const stateRef = useRef({ loading, hasNextPage, page });
  stateRef.current = { loading, hasNextPage, page };

  /** Load the next page and append results */
  const loadMore = useCallback(async () => {
    const { loading, hasNextPage, page } = stateRef.current;
    if (loading || !hasNextPage) return;

    const nextPage = page + 1;
    setLoading(true);
    setError(null);

    try {
      const prismaArgs = getPrismaArgs(nextPage);
      const { data, total: newTotal } = await fetchFn(prismaArgs);

      setItems((prev) => [...prev, ...data]);
      setTotal(newTotal);
      setPage(nextPage);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, getPrismaArgs]);

  /** Initial / reset load — replaces items instead of appending */
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    setItems([]);

    try {
      const prismaArgs = getPrismaArgs(1);
      const { data, total: newTotal } = await fetchFn(prismaArgs);

      setItems(data);
      setTotal(newTotal);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, getPrismaArgs]);

  /**
   * Attach this ref to the sentinel element at the bottom of your list.
   * The hook will call loadMore() automatically when it enters the viewport.
   */
  const observerRef = useRef(null);
  const sentinelRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) loadMore();
        },
        { threshold: 0.1 },
      );

      observerRef.current.observe(node);
    },
    [loadMore],
  );

  return {
    // Data
    items,
    loading,
    error,

    // Actions
    loadMore,
    reload,

    // Sentinel ref — attach to a <div> at the bottom of your list
    sentinelRef,

    // Mirrors Pagination API
    getMeta,
    getPrismaArgs,
    hasNextPage,
    hasPrevPage,
  };
}
