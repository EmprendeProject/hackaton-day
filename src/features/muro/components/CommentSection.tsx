import { useState, useRef, useEffect } from "react";
import { Send, CornerDownRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Comment } from "../../../types";
import { useAuth } from "../../../context/AuthContext";

const MAX_DEPTH = 4;

interface Reactor { reaction_type: string; name: string; avatar: string | null; }

function CommentReactionPill({ postId, commentId, topEmojis, total, userReaction }: {
  postId: string;
  commentId: string;
  topEmojis: string[];
  total: number;
  userReaction: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const [reactors, setReactors] = useState<Reactor[] | null>(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (reactors === null) {
      fetch(`/api/posts/${postId}/comments/${commentId}/reactions`)
        .then((r) => r.json())
        .then(setReactors)
        .catch(() => setReactors([]));
    }
  };

  return (
    <div
      className="relative ml-auto"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`flex items-center gap-0.5 text-xs font-semibold cursor-default ${userReaction ? "text-indigo-600" : "text-slate-400"}`}>
        <span>{topEmojis.join("")}</span>
        <span>{total}</span>
      </span>

      <AnimatePresence>
        {hovered && reactors && reactors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-6 right-0 bg-slate-800 text-white text-xs rounded-xl py-2 px-3 shadow-xl z-20 min-w-max max-w-50"
          >
            <div className="space-y-1.5">
              {reactors.map((r, i) => {
                const emoji = REACTIONS.find((rx) => rx.type === r.reaction_type)?.emoji ?? "👍";
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="truncate">{r.name}</span>
                    <span className="ml-auto">{emoji}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const REACTIONS = [
  { type: "like",  emoji: "👍" },
  { type: "love",  emoji: "❤️" },
  { type: "laugh", emoji: "😂" },
  { type: "fire",  emoji: "🔥" },
  { type: "clap",  emoji: "👏" },
];

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Ahora";
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Hace ${Math.floor(diff / 86400)} días`;
  return new Date(dateStr).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  isLoading: boolean;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onReact: (postId: string, commentId: string, reactionType: string) => Promise<void>;
}

interface CommentItemProps {
  postId: string;
  comment: Comment;
  depth: number;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onReact: (postId: string, commentId: string, reactionType: string) => Promise<void>;
}

function CommentItem({ postId, comment, depth, onAddComment, onReact }: CommentItemProps) {
  const { user } = useAuth();
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyValue, setReplyValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  const handleReply = async () => {
    if (!replyValue.trim()) return;
    setIsSending(true);
    await onAddComment(replyValue.trim(), comment.id);
    setReplyValue("");
    setIsSending(false);
    setReplying(false);
    setShowReplies(true);
  };

  const handleReact = async (type: string) => {
    setShowPicker(false);
    await onReact(postId, comment.id, type);
  };

  const replyCount = comment.replies?.length ?? 0;
  const userEmoji = comment.userReaction
    ? REACTIONS.find((r) => r.type === comment.userReaction)?.emoji
    : null;

  const totalReactions = Object.values(comment.reactions ?? {}).reduce((a, b) => a + b, 0);
  const topEmojis = Object.entries(comment.reactions ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji ?? "");

  return (
    <div className="flex gap-3">
      {comment.avatar ? (
        <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-xl object-cover shrink-0 mt-0.5" />
      ) : (
        <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 mt-0.5">
          {comment.author?.[0]?.toUpperCase() ?? "U"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Burbuja original */}
        <div className="bg-slate-50 rounded-2xl px-4 py-3 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-black text-slate-700">{comment.author}</p>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">{comment.role}</span>
            <span className="text-xs text-slate-400 ml-auto">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-sm text-slate-700 font-medium leading-snug">{comment.content}</p>
        </div>

        {/* Barra de acciones */}
        <div className="flex items-center gap-3 mt-1 ml-1">
          {/* Me gusta con picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                comment.userReaction ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {userEmoji ? `${userEmoji} Reaccionar` : "Reaccionar"}
            </button>

            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-7 left-0 flex gap-1 bg-white border border-slate-200 rounded-2xl px-2 py-1.5 shadow-lg z-10"
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r.type}
                      onClick={() => handleReact(r.type)}
                      className={`text-xl hover:scale-125 transition-transform p-0.5 rounded-lg ${
                        comment.userReaction === r.type ? "bg-indigo-100" : ""
                      }`}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {depth < MAX_DEPTH && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <CornerDownRight size={12} />
              Responder
            </button>
          )}

          {totalReactions > 0 && (
            <CommentReactionPill
              postId={postId}
              commentId={comment.id}
              topEmojis={topEmojis}
              total={totalReactions}
              userReaction={comment.userReaction}
            />
          )}
        </div>

        {/* Input respuesta */}
        <AnimatePresence>
          {replying && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden mt-2"
            >
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl px-4 py-2">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name ?? "U"} className="w-6 h-6 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                    {user?.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <input
                  autoFocus
                  value={replyValue}
                  onChange={(e) => setReplyValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  placeholder={`Responder a ${comment.author}...`}
                  className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyValue.trim() || isSending}
                  className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Respuestas plegables */}
        {replyCount > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies((v) => !v)}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors ml-1 mb-2"
            >
              {showReplies
                ? "Ocultar respuestas"
                : `Ver ${replyCount} ${replyCount === 1 ? "respuesta" : "respuestas"}`}
            </button>

            <AnimatePresence>
              {showReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden space-y-3 pl-2 border-l-2 border-slate-100"
                >
                  {comment.replies!.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      postId={postId}
                      comment={reply}
                      depth={depth + 1}
                      onAddComment={onAddComment}
                      onReact={onReact}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postId, comments, isLoading, onAddComment, onReact }: CommentSectionProps) {
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
          {/* Input nuevo comentario */}
          <div className="flex items-center gap-3">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name ?? "Usuario"} className="w-8 h-8 rounded-xl object-cover shrink-0" />
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

          {/* Lista de comentarios */}
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-2">Sé el primero en comentar</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <motion.div key={comment.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <CommentItem
                    postId={postId}
                    comment={comment}
                    depth={1}
                    onAddComment={onAddComment}
                    onReact={onReact}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
