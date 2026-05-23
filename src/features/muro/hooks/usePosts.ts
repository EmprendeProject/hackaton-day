import { useState, useEffect, useCallback } from "react";
import { Post } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

const PAGE_SIZE = 10;

async function fetchPage(userId?: string, cursor?: string): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  if (userId) params.set("userId", userId);
  const res = await fetch(`/api/posts?${params}`);
  const data = await res.json();
  if (Array.isArray(data)) return { posts: data, nextCursor: null };
  return { posts: data.posts ?? [], nextCursor: data.nextCursor ?? null };
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setIsLoading(true);

    fetchPage(user?.id)
      .then(({ posts, nextCursor }) => {
        if (cancelled) return;
        setPosts(posts);
        setCursor(nextCursor);
        setHasMore(nextCursor !== null);
      })
      .catch((err) => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [user?.id]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursor) return;
    setIsLoadingMore(true);
    try {
      const { posts: more, nextCursor } = await fetchPage(user?.id, cursor);
      setPosts((prev) => [...prev, ...more]);
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, cursor, user?.id]);

  const createPost = async (content: string) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, userId: user?.id }),
    });
    if (!res.ok) return;
    const newPost = await res.json();
    setPosts((prev) => [newPost, ...prev]);
  };

  return { posts, isLoading, isLoadingMore, hasMore, loadMore, createPost };
}
