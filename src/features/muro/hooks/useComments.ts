import { useState } from "react";
import { Comment } from "../../../types";

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggle = () => {
    if (!isOpen) fetchComments();
    setIsOpen((prev) => !prev);
  };

  const addComment = async (content: string, author: string, avatar?: string) => {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, author, avatar }),
    });
    if (!res.ok) return;
    const newComment: Comment = await res.json();
    setComments((prev) => [...prev, newComment]);
  };

  return { comments, isLoading, isOpen, toggle, addComment };
}
