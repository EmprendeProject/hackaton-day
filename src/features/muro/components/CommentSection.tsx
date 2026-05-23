import React, { useState } from "react";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Comment } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

interface CommentSectionProps {
  comments: Comment[];
  isLoading: boolean;
  onAddComment: (content: string) => Promise<void>;
}

export default function CommentSection({ comments, isLoading, onAddComment }: CommentSectionProps) {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setIsSending(true);
    await onAddComment(value.trim());
    setValue("");
    setIsSending(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="pt-6 border-t border-slate-100 space-y-4">
          {/* Input */}
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name ?? "Usuario"}
                className="w-8 h-8 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
              />
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || isSending}
                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Comments list */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-2">
              Sé el primero en comentar
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  {comment.avatar ? (
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      className="w-8 h-8 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                      {comment.author?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-2xl px-4 py-3 flex-1">
                    <p className="text-xs font-black text-slate-500 mb-1">{comment.author}</p>
                    <p className="text-sm text-slate-700 font-medium leading-snug">{comment.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
