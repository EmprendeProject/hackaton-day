import React from "react";
import { Heart, MessageSquare, Share2, MoreHorizontal, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import { Post } from "../../../types";

interface PostCardProps {
  post: Post;
  index: number;
}

export default function PostCard({ post, index }: PostCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md group-hover:rotate-3 transition-transform">
            <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{post.author}</h4>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {post.role} • {post.timestamp}
            </p>
          </div>
        </div>
        <button className="text-slate-300 hover:text-slate-900 transition-colors">
          <MoreHorizontal size={24} />
        </button>
      </div>

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

      <div className="flex items-center gap-8 pt-6 border-t border-slate-50">
        <button className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-all font-bold text-sm">
          <Heart size={20} />
          <span>{post.likes}</span>
        </button>
        <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-bold text-sm">
          <MessageSquare size={20} />
          <span>{post.comments}</span>
        </button>
        <button className="ml-auto p-2 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all">
          <Share2 size={18} />
        </button>
      </div>
    </motion.article>
  );
}
