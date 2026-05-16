export interface Post {
  id: string;
  author: string;
  role: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  avatar: string;
  tip?: {
    title: string;
    content: string;
  };
  tags?: string[];
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

export type View = "muro" | "classroom" | "profile" | "explore";

export interface Comment {
  id: string;
  post_id: string;
  author: string;
  avatar: string;
  content: string;
  created_at: string;
}
