import { useState, useEffect } from "react";
import { Post } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then(setPosts)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const createPost = async (content: string) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, author: user?.name, avatar: user?.avatar }),
    });
    const newPost = await res.json();
    setPosts((prev) => [newPost, ...prev]);
  };

  return { posts, isLoading, createPost };
}
