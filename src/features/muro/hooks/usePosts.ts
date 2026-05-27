import { useState, useEffect, useCallback, useRef } from "react";
import { Post } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

const PAGE_SIZE = 10;

async function fetchPage(userId?: string, cursor?: string, tags: string[] = []): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  if (userId) params.set("userId", userId);
  if (tags.length > 0) params.set("tags", tags.join(","));
  const res = await fetch(`/api/posts?${params}`);
  if (!res.ok) throw new Error("Error al cargar posts");
  const data = await res.json();
  if (Array.isArray(data)) return { posts: data, nextCursor: null };
  return { posts: data.posts ?? [], nextCursor: data.nextCursor ?? null };
}

export function usePosts(selectedTags: string[] = []) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { user } = useAuth();
  const likeTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendingToggles = useRef(new Map<string, number>());

  useEffect(() => {
    // No fetchear hasta tener el userId — evita que posts carguen sin userHasLiked correcto
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    setPosts([]);
    setCursor(null);
    setHasMore(true);
    setIsLoading(true);

    fetchPage(user.id, undefined, selectedTags)
      .then(({ posts, nextCursor }) => {
        if (cancelled) return;
        setPosts(posts);
        setCursor(nextCursor);
        setHasMore(nextCursor !== null);
      })
      .catch((err) => { if (!cancelled) console.error(err); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [user?.id, selectedTags.join(",")]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursor || !user?.id) return;
    setIsLoadingMore(true);
    try {
      const { posts: more, nextCursor } = await fetchPage(user.id, cursor, selectedTags);
      setPosts((prev) => [...prev, ...more]);
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, cursor, user?.id]);

  const createPost = useCallback(async (content: string, tagIds: string[] = [], imageData?: string) => {
    if (!user) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, userId: user.id, tagIds, imageData }),
    });
    if (!res.ok) return;
    const newPost: Post = await res.json();
    setPosts((prev) => {
      const updated = [newPost, ...prev];
      return [...updated.filter((p) => p.pinned), ...updated.filter((p) => !p.pinned)];
    });
  }, [user]);

  const reactToPost = useCallback(async (postId: string, reactionType: string) => {
    if (!user) return;

    // Actualización optimista inmediata
    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const prev_reaction = p.userReaction;
      const reactions = { ...p.reactions };
      if (prev_reaction) reactions[prev_reaction] = Math.max(0, (reactions[prev_reaction] ?? 1) - 1);
      const isSame = prev_reaction === reactionType;
      if (!isSame) reactions[reactionType] = (reactions[reactionType] ?? 0) + 1;
      const userReaction = isSame ? null : reactionType;
      const likes = Object.values(reactions).reduce((a, b) => a + b, 0);
      return { ...p, reactions, userReaction, likes };
    }));

    // Confirmar con el servidor
    const res = await fetch(`/api/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, reactionType }),
    });
    if (!res.ok) return;
    const { reactions, userReaction } = await res.json();
    const total = Object.values(reactions as Record<string, number>).reduce((a, b) => a + b, 0);
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, reactions, userReaction, likes: total } : p)
    );
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (res.ok) setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, [user]);

  const editPost = useCallback(async (postId: string, content: string, imageData?: string, removeImage?: boolean, tagIds?: string[]) => {
    if (!user) return;
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, content, imageData, removeImage, tagIds }),
    });
    if (!res.ok) return;
    const { image_url, tags } = await res.json();
    setPosts((prev) => prev.map((p) => p.id === postId ? {
      ...p,
      content,
      image_url: image_url !== undefined ? image_url : p.image_url,
      tags: tags !== undefined ? tags : p.tags,
    } : p));
  }, [user]);

  const pinPost = useCallback(async (postId: string) => {
    if (!user) return;
    const res = await fetch(`/api/posts/${postId}/pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (!res.ok) return;
    const { pinned } = await res.json();
    setPosts((prev) => {
      const updated = prev.map((p) => p.id === postId ? { ...p, pinned } : p);
      return [...updated.filter((p) => p.pinned), ...updated.filter((p) => !p.pinned)];
    });
  }, [user]);

  const incrementCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    );
  }, []);

  return { posts, isLoading, isLoadingMore, hasMore, loadMore, createPost, reactToPost, deletePost, editPost, pinPost, incrementCommentCount };
}
