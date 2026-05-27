import { MessageSquare, Share2, MoreHorizontal, Lightbulb, Smile, Pin, Pencil, Trash2, Check, X, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { Post } from "../../../types";
import { useComments } from "../hooks/useComments";
import CommentSection from "./CommentSection";

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

interface TagOption { id: string; name: string; }

interface PostCardProps {
  post: Post;
  index: number;
  onReact: (postId: string, reactionType: string) => void;
  onDelete: (postId: string) => void;
  onEdit: (postId: string, content: string, imageData?: string, removeImage?: boolean, tagIds?: string[]) => void;
  onPin: (postId: string) => void;
  onCommentAdded: (postId: string) => void;
}

export default function PostCard({ post, index, onReact, onDelete, onEdit, onPin, onCommentAdded }: PostCardProps) {
  const { comments, totalCount, isLoading: commentsLoading, isOpen, toggle, addComment, reactToComment } = useComments(post.id);
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(post.content);
  const [editImageData, setEditImageData] = useState<string | undefined>();
  const [removeImage, setRemoveImage] = useState(false);
  const [editTags, setEditTags] = useState<TagOption[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [reactors, setReactors] = useState<{ name: string; avatar: string | null; reaction_type: string }[] | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const handleReactorsHover = async () => {
    setShowTooltip(true);
    if (reactors !== null) return;
    const res = await fetch(`/api/posts/${post.id}/reactions`);
    if (res.ok) setReactors(await res.json());
  };

  const startEditing = async () => {
    setShowMenu(false);
    setEditValue(post.content);
    setEditImageData(undefined);
    setRemoveImage(false);
    setEditing(true);
    fetch("/api/tags")
      .then((r) => r.json())
      .then((tags: TagOption[]) => {
        setEditTags(tags);
        setSelectedTagIds(tags.filter((t) => post.tags?.includes(t.name)).map((t) => t.id));
      })
      .catch(() => {});
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setEditImageData(canvas.toDataURL("image/webp", 0.82));
        setRemoveImage(false);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = () => {
    if (!editValue.trim()) return;
    onEdit(post.id, editValue.trim(), editImageData, removeImage, selectedTagIds);
    setEditing(false);
  };

  const commentsCount = isOpen ? totalCount : post.comments;

  const handleAddComment = async (content: string, parentId?: string) => {
    const ok = await addComment(content, parentId);
    if (ok) onCommentAdded(post.id);
  };

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-[2rem] border p-8 shadow-sm hover:shadow-md transition-all group ${post.pinned ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200"}`}
    >
      {/* Badge pin */}
      {post.pinned && (
        <div className="flex items-center gap-1.5 text-indigo-500 text-xs font-bold mb-3">
          <Pin size={12} className="fill-indigo-500" />
          Publicación fijada
        </div>
      )}

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

        {/* Menú tres puntos */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="text-slate-300 hover:text-slate-900 transition-colors"
          >
            <MoreHorizontal size={24} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-8 bg-white border border-slate-200 rounded-2xl shadow-lg z-20 overflow-hidden min-w-[160px]"
              >
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Pencil size={15} className="text-indigo-500" /> Editar
                </button>
                <button
                  onClick={() => { setShowMenu(false); onPin(post.id); }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Pin size={15} className={post.pinned ? "fill-indigo-500 text-indigo-500" : "text-indigo-500"} />
                  {post.pinned ? "Desfijar" : "Fijar post"}
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(post.id); }}
                  className="flex items-center gap-2.5 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} /> Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content / Edit mode */}
      {editing ? (
        <div className="mb-6 space-y-3">
          {/* Texto */}
          <textarea
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-slate-600 font-medium leading-relaxed outline-none resize-none border border-indigo-200 focus:border-indigo-400 transition-colors"
            rows={3}
          />

          {/* Imagen */}
          <div>
            <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditImageChange} />
            {(editImageData || (post.image_url && !removeImage)) ? (
              <div className="relative w-fit">
                <img
                  src={editImageData ?? post.image_url!}
                  alt="preview"
                  className="max-h-48 rounded-2xl object-cover border border-slate-100"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => editFileRef.current?.click()}
                    className="bg-slate-800/60 text-white rounded-full p-1.5 hover:bg-slate-800 transition-colors"
                    title="Cambiar imagen"
                  >
                    <ImagePlus size={12} />
                  </button>
                  <button
                    onClick={() => { setEditImageData(undefined); setRemoveImage(true); }}
                    className="bg-slate-800/60 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                    title="Quitar imagen"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => editFileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-indigo-500 border border-dashed border-slate-200 transition-colors"
              >
                <ImagePlus size={14} /> Agregar imagen
              </button>
            )}
          </div>

          {/* Tags */}
          {editTags.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {editTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setSelectedTagIds((prev) =>
                      prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                    )}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedTagIds.includes(tag.id)
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">
              <X size={13} /> Cancelar
            </button>
            <button onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
              <Check size={13} /> Guardar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-slate-600 leading-relaxed font-medium mb-6">{post.content}</p>
      )}

      {post.image_url && !editing && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-100">
          <img src={post.image_url} alt="imagen del post" className="w-full object-cover max-h-96" />
        </div>
      )}

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
        <div className="flex items-center gap-2">
          {/* Botón reaccionar con picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className={`flex items-center gap-1.5 transition-all font-bold text-sm ${
                post.userReaction ? "text-indigo-600" : "text-slate-400 hover:text-indigo-600"
              }`}
            >
              {post.userReaction
                ? <span className="text-lg leading-none">{REACTIONS.find((r) => r.type === post.userReaction)?.emoji}</span>
                : <Smile size={20} />
              }
            </button>

            <AnimatePresence>
              {showPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute bottom-10 left-0 flex gap-1 bg-white border border-slate-200 rounded-2xl px-2 py-1.5 shadow-lg z-10"
                >
                  {REACTIONS.map((r) => (
                    <button
                      key={r.type}
                      onClick={() => { setShowPicker(false); onReact(post.id, r.type); }}
                      className={`text-2xl hover:scale-125 transition-transform p-0.5 rounded-lg ${
                        post.userReaction === r.type ? "bg-indigo-100" : ""
                      }`}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Top 3 reacciones + conteo con tooltip */}
          {post.likes > 0 && (
            <div
              ref={tooltipRef}
              className="relative flex items-center gap-1 cursor-default"
              onMouseEnter={handleReactorsHover}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className="text-base leading-none">
                {Object.entries(post.reactions)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([type]) => REACTIONS.find((r) => r.type === type)?.emoji)
                  .join("")}
              </span>
              <span className={`text-sm font-bold ${post.userReaction ? "text-indigo-600" : "text-slate-400"}`}>
                {post.likes}
              </span>

              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute bottom-8 left-0 bg-slate-800 text-white text-xs rounded-xl px-3 py-2 shadow-lg z-10 min-w-max max-w-[200px]"
                  >
                    {reactors === null ? (
                      <span className="text-slate-400">Cargando...</span>
                    ) : reactors.length === 0 ? (
                      <span className="text-slate-400">Sin reacciones</span>
                    ) : (
                      <ul className="space-y-1">
                        {reactors.slice(0, 8).map((r, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span>{REACTIONS.find((rx) => rx.type === r.reaction_type)?.emoji}</span>
                            <span className="font-medium truncate">{r.name}</span>
                          </li>
                        ))}
                        {reactors.length > 8 && (
                          <li className="text-slate-400">y {reactors.length - 8} más...</li>
                        )}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

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
          postId={post.id}
          comments={comments}
          isLoading={commentsLoading}
          onAddComment={handleAddComment}
          onReact={reactToComment}
        />
      )}
    </motion.article>
  );
}
