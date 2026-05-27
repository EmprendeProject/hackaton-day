import { useState, useEffect, useRef } from "react";
import { Send, Tag, Plus, X, ImagePlus } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

interface CreatePostProps {
  onSubmit: (content: string, tagIds: string[], imageData?: string) => void;
}

interface TagOption { id: string; name: string; }

export default function CreatePost({ onSubmit }: CreatePostProps) {
  const [value, setValue] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [imageData, setImageData] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setAllTags).catch(() => {});
  }, []);

  const toggleTag = (id: string) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreateTag = async () => {
    if (!newTag.trim() || creatingTag) return;
    setCreatingTag(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag.trim() }),
      });
      if (res.ok) {
        const tag: TagOption = await res.json();
        setAllTags((prev) => prev.find((t) => t.id === tag.id) ? prev : [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedIds((prev) => prev.includes(tag.id) ? prev : [...prev, tag.id]);
        setNewTag("");
      }
    } finally {
      setCreatingTag(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setImageData(canvas.toDataURL("image/webp", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim(), selectedIds, imageData);
    setValue("");
    setSelectedIds([]);
    setImageData(undefined);
    setShowTags(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
      <div className="p-6 flex items-center space-x-4">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.name ?? "Usuario"} className="w-10 h-10 rounded-2xl object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-inner flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          type="text"
          placeholder="Comparte algo con la comunidad..."
          className="bg-slate-50 border-none rounded-2xl flex-1 px-6 py-3 text-sm font-medium focus:ring-0 placeholder:text-slate-400"
        />
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        <button
          onClick={() => fileRef.current?.click()}
          className={`p-3 rounded-2xl transition-all ${imageData ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-50"}`}
          title="Agregar imagen"
        >
          <ImagePlus size={18} />
        </button>
        <button
          onClick={() => setShowTags((v) => !v)}
          className={`p-3 rounded-2xl transition-all ${showTags ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:text-indigo-500 hover:bg-slate-50"}`}
          title="Agregar tags"
        >
          <Tag size={18} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
        >
          <Send size={20} />
        </button>
      </div>

      {imageData && (
        <div className="px-6 pb-4 relative w-fit">
          <img src={imageData} alt="preview" className="max-h-48 rounded-2xl object-cover border border-slate-100" />
          <button
            onClick={() => { setImageData(undefined); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute top-2 right-2 bg-slate-800/60 text-white rounded-full p-1 hover:bg-slate-800 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {showTags && (
        <div className="px-6 pb-5 border-t border-slate-50 pt-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Agregar tags</p>

          {/* Input crear nuevo tag */}
          <div className="flex gap-2 mb-3">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              placeholder="Nuevo tag..."
              className="flex-1 bg-slate-50 rounded-xl px-3 py-1.5 text-xs font-medium outline-none border border-slate-200 focus:border-indigo-300 transition-colors placeholder:text-slate-400"
            />
            <button
              onClick={handleCreateTag}
              disabled={!newTag.trim() || creatingTag}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
            >
              <Plus size={13} /> Crear
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedIds.includes(tag.id)
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <button onClick={() => toggleTag(tag.id)} className="hover:opacity-80 transition-opacity">
                  #{tag.name}
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/tags/${tag.id}`, { method: "DELETE" });
                    setAllTags((prev) => prev.filter((t) => t.id !== tag.id));
                    setSelectedIds((prev) => prev.filter((id) => id !== tag.id));
                  }}
                  className="ml-0.5 hover:opacity-70 transition-opacity"
                  title="Eliminar tag"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            {allTags.length === 0 && (
              <p className="text-xs text-slate-400">No hay tags disponibles</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
