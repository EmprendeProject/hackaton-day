import { useState, useCallback } from "react";
import { Comment } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Error al cargar comentarios");
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) fetchComments();
      return !prev;
    });
  }, [fetchComments]);

  const addComment = useCallback(async (content: string): Promise<boolean> => {
    if (!user) return false;
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, userId: user.id }),
    });
    if (!res.ok) return false;
    const newComment: Comment = await res.json();
    setComments((prev) => [...prev, newComment]);
    return true;
  }, [postId, user]);

  return { comments, isLoading, isOpen, toggle, addComment };
}
