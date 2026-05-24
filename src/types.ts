export interface Post {
  id: string;
  user_id: string;
  author: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  created_at: string;
  userHasLiked: boolean;
  avatar: string;
  tags?: string[];
  tip?: {
    title: string;
    content: string;
  };
}

export interface Course {
  id: string;
  title: string;
  category: string;
  module: string;
  progress: number;
  description: string;
  thumbnail: string;
}

export type View = "muro" | "classroom" | "profile" | "explore" | "admin";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author: string;
  avatar: string | null;
  content: string;
  created_at: string;
}
