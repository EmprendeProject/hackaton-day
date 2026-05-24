import { useState, useEffect, useCallback, useRef } from "react";
import { Post } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

const PAGE_SIZE = 10;

async function fetchPage(userId?: string, cursor?: string): Promise<{ posts: Post[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
  if (cursor) params.set("cursor", cursor);
  if (userId) params.set("userId", userId);
  const res = await fetch(`/api/posts?${params}`);
  if (!res.ok) throw new Error("Error al cargar posts");
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

    fetchPage(user.id)
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
    if (!hasMore || isLoadingMore || !cursor || !user?.id) return;
    setIsLoadingMore(true);
    try {
      const { posts: more, nextCursor } = await fetchPage(user.id, cursor);
      setPosts((prev) => [...prev, ...more]);
      setCursor(nextCursor);
      setHasMore(nextCursor !== null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, cursor, user?.id]);

  const createPost = useCallback(async (content: string) => {
    if (!user) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, userId: user.id }),
    });
    if (!res.ok) return;
    const newPost: Post = await res.json();
    setPosts((prev) => [newPost, ...prev]);
  }, [user]);

  const toggleLike = useCallback((postId: string) => {
    if (!user) return;

    // Cada click cuenta: impar = cambio neto, par = sin cambio neto
    const count = (pendingToggles.current.get(postId) ?? 0) + 1;
    pendingToggles.current.set(postId, count);

    // Toggle visual inmediato sin bloquear el botón
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, userHasLiked: !p.userHasLiked, likes: p.userHasLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );

    // Reiniciar el timer con cada click
    const existing = likeTimers.current.get(postId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      likeTimers.current.delete(postId);
      const toggles = pendingToggles.current.get(postId) ?? 0;
      pendingToggles.current.delete(postId);

      // Número par de clicks = estado igual al original, no hay que llamar al API
      if (toggles % 2 === 0) return;

      try {
        const res = await fetch(`/api/posts/${postId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Confirmar con valores reales del servidor
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, userHasLiked: data.liked, likes: data.likes } : p
          )
        );
      } catch {
        // Revertir el cambio neto en caso de error
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, userHasLiked: !p.userHasLiked, likes: p.userHasLiked ? p.likes - 1 : p.likes + 1 }
              : p
          )
        );
      }
    }, 1000);

    likeTimers.current.set(postId, timer);
  }, [user]);

  const incrementCommentCount = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: p.comments + 1 } : p))
    );
  }, []);

  return { posts, isLoading, isLoadingMore, hasMore, loadMore, createPost, toggleLike, incrementCommentCount };
}
