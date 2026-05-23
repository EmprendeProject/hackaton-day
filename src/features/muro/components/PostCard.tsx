import React, { useState, useEffect } from "react";
import { Heart, MessageSquare, Share2, MoreHorizontal, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import { Post } from "../../../types";
import { useAuth } from "../../../context/AuthContext";
import { useComments } from "../hooks/useComments";
import CommentSection from "./CommentSection";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

interface PostCardProps {
  key?: React.Key;
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.userHasLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments);

  const { comments, isLoading: commentsLoading, isOpen, toggle, addComment } = useComments(post.id);

  useEffect(() => {
    setLiked(post.userHasLiked ?? false);
    setLikesCount(post.likes);
  }, [post.id, post.userHasLiked]);

  useEffect(() => {
    if (!commentsLoading && isOpen) {
      setCommentsCount(comments.length);
    }
  }, [comments.length, commentsLoading, isOpen]);

  const handleAddComment = async (content: string) => {
    await addComment(content);
    setCommentsCount((prev) => prev + 1);
  };

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    // optimistic update
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLiked(data.liked);
      setLikesCount(data.likes);
    } catch {
      // revert on error
      setLiked((prev) => !prev);
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md group-hover:rotate-3 transition-transform">
            {post.avatar ? (
              <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                {post.author?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{post.author}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {post.role} • {timeAgo(post.created_at)}
            </p>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-900 transition-colors">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Content */}
      <p className="text-slate-600 leading-relaxed font-medium mb-6">{post.content}</p>

      {post.tip && (
        <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100 flex items-start gap-4 mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm text-indigo-600 border border-indigo-50">
            <Lightbulb size={24} />
          </div>
          <div>
            <h5 className="font-bold text-indigo-900">{post.tip.title}</h5>
            <p className="text-sm text-indigo-700/80 mt-1 font-medium leading-relaxed">{post.tip.content}</p>
          </div>
        </div>
      )}

      {post.tags && post.tags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {post.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-8 pt-6 border-t border-slate-50">
        <button
          onClick={handleLike}
          disabled={!user}
          className={`flex items-center gap-2 transition-all font-bold text-sm group/like ${
            liked ? "text-red-500" : "text-slate-400 hover:text-red-500"
          }`}
        >
          <Heart
            size={20}
            className={`transition-transform group-active/like:scale-125 ${liked ? "fill-red-500" : ""}`}
          />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={toggle}
          className={`flex items-center gap-2 transition-all font-bold text-sm ${
            isOpen ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
          }`}
        >
          <MessageSquare size={20} />
          <span>{commentsCount}</span>
        </button>

        <button className="ml-auto p-2 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all">
          <Share2 size={18} />
        </button>
      </div>

      {/* Comment Section */}
      {isOpen && (
        <CommentSection
          comments={comments}
          isLoading={commentsLoading}
          onAddComment={handleAddComment}
        />
      )}
    </motion.article>
  );
}
