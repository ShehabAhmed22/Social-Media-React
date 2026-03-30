import { useState, useEffect, useCallback, useRef } from "react";

/**
 * useSearch
 *
 * A global-ready debounced search hook.
 * Mirrors the Pagination class pattern — clean API, Prisma-ready args.
 *
 * @param {object} options
 * @param {Function} options.fetchFn      - async (searchArgs) => { data: [], total: number }
 * @param {number}  [options.debounce=400] - debounce delay in ms
 * @param {number}  [options.minChars=2]   - minimum characters before searching
 * @param {string}  [options.initialQuery=""]
 * @param {string}  [options.searchField="search"] - prisma field name (e.g. "q", "query", "search")
 */
export function useSearch({
  fetchFn,
  debounce = 400,
  minChars = 2,
  initialQuery = "",
  searchField = "search",
} = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isReady = debouncedQuery.trim().length >= minChars;

  // Mirrors Pagination.prismaArgs
  const getSearchArgs = useCallback(
    (q = debouncedQuery) => ({
      where: {
        [searchField]: {
          contains: q.trim(),
          mode: "insensitive",
        },
      },
    }),
    [debouncedQuery, searchField],
  );

  // Mirrors Pagination.getMeta()
  const getMeta = useCallback(
    () => ({
      query: debouncedQuery,
      total,
      minChars,
      isReady,
      isEmpty: isReady && total === 0 && !loading,
    }),
    [debouncedQuery, total, minChars, isReady, loading],
  );

  // Debounce: update debouncedQuery after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounce);

    return () => clearTimeout(timer);
  }, [query, debounce]);

  // Fetch when debouncedQuery changes
  const abortRef = useRef(null);

  useEffect(() => {
    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();

    if (!isReady) {
      setResults([]);
      setTotal(0);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const searchArgs = getSearchArgs(debouncedQuery);
        const { data, total: newTotal } = await fetchFn(
          searchArgs,
          controller.signal,
        );

        if (!controller.signal.aborted) {
          setResults(data);
          setTotal(newTotal);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => controller.abort();
  }, [debouncedQuery, isReady]);

  /** Manually trigger a search (e.g. on form submit) */
  const search = useCallback(
    async (overrideQuery) => {
      const q = (overrideQuery ?? query).trim();
      if (q.length < minChars) return;

      setLoading(true);
      setError(null);

      try {
        const searchArgs = getSearchArgs(q);
        const { data, total: newTotal } = await fetchFn(searchArgs);
        setResults(data);
        setTotal(newTotal);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [query, minChars, fetchFn, getSearchArgs],
  );

  /** Clear query and results */
  const clear = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setTotal(0);
    setError(null);
  }, []);

  return {
    // Input binding — spread directly onto <input>
    inputProps: {
      value: query,
      onChange: (e) => setQuery(e.target.value),
    },

    // State
    query,
    debouncedQuery,
    results,
    loading,
    error,

    // Actions
    setQuery,
    search,
    clear,

    // Mirrors Pagination API
    getMeta,
    getSearchArgs,
    isReady,
  };
}
