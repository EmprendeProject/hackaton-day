import { useState, useEffect, useCallback } from "react";
import { Post } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

const PAGE_SIZE = 10;

async function fetchPage(cursor?: string): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const url = cursor
    ? `/api/posts?limit=${PAGE_SIZE}&cursor=${encodeURIComponent(cursor)}`
    : `/api/posts?limit=${PAGE_SIZE}`;
  const res = await fetch(url);
  const data = await res.json();
  if (Array.isArray(data)) return { posts: data, nextCursor: null }; // fallback
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
    fetchPage()
      .then(({ posts, nextCursor }) => {
        setPosts(posts);
        setCursor(nextCursor);
        setHasMore(nextCursor !== null);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursor) return;
    setIsLoadingMore(true);
    try {
      const { posts: more, nextCursor } = await fetchPage(cursor);
      setPosts((prev) => [...prev, ...more]);
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, cursor]);

  const createPost = async (content: string) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, author: user?.name, avatar: user?.avatar, userId: user?.id }),
    });
    const newPost = await res.json();
    setPosts((prev) => [newPost, ...prev]);
  };

  return { posts, isLoading, isLoadingMore, hasMore, loadMore, createPost };
}
