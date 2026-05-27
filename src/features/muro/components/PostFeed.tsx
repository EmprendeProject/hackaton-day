import { useRef, useEffect, useState } from "react";
import { usePosts } from "../hooks/usePosts";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import Spinner from "../../../shared/ui/Spinner";

interface TagOption { id: string; name: string; }

export default function PostFeed() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagOption[]>([]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then(setAllTags).catch(() => {});
  }, []);

  const toggleTag = (name: string) =>
    setSelectedTags((prev) => prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]);

  const { posts, isLoading, isLoadingMore, hasMore, loadMore, createPost, reactToPost, deletePost, editPost, pinPost, incrementCommentCount } = usePosts(selectedTags);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);

  // Keep ref in sync without re-creating the observer
  useEffect(() => { loadMoreRef.current = loadMore; });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreRef.current(); },
      { rootMargin: "400px" } // preload 400px antes de llegar al fondo
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  if (isLoading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Hero Welcome Cell */}
      <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">¡Bienvenido de nuevo!</h1>
          <p className="text-slate-500 font-medium leading-relaxed">
            Comparte ideas, hace preguntas y conecta con tu comunidad.
          </p>
        </div>
        <div className="hidden sm:flex -space-x-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-100 shadow-sm overflow-hidden">
              <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
            </div>
          ))}
          <div className="w-12 h-12 rounded-full border-4 border-white bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white shadow-sm">
            +12
          </div>
        </div>
      </div>

      {/* Progress Cell */}
      <div className="lg:col-span-4 bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between min-h-[160px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
        <div className="relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest opacity-80">Progreso Mensual</span>
          <p className="text-4xl font-black mt-2">84%</p>
        </div>
        <div className="relative z-10">
          <div className="w-full bg-indigo-400/30 h-2.5 rounded-full mt-4">
            <div className="bg-white h-2.5 rounded-full shadow-sm" style={{ width: "84%" }}></div>
          </div>
          <p className="text-xs font-semibold mt-3 text-indigo-100 tracking-wide">¡Casi alcanzas tu meta!</p>
        </div>
      </div>

      {/* Main Feed */}
      <div className="lg:col-span-8 space-y-6">
        {/* Barra de filtro por tags */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filtrar:</span>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedTags.includes(tag.name)
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                }`}
              >
                #{tag.name}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-red-400 hover:bg-red-50 transition-all"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        <CreatePost onSubmit={createPost} />

        {posts.map((post, idx) => (
          <PostCard
              key={post.id}
              post={post}
              index={idx}
              onReact={reactToPost}
              onDelete={deletePost}
              onEdit={editPost}
              onPin={pinPost}
              onCommentAdded={incrementCommentCount}
            />
        ))}

        {/* Sentinel: el observer dispara loadMore cuando este div entra en vista */}
        <div ref={sentinelRef} />

        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest py-4">
            Has visto todos los posts
          </p>
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col min-h-[300px]">
          <h3 className="font-bold text-xl mb-6 text-slate-900 flex items-center justify-between">
            Miembros Online
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
          </h3>
          <div className="space-y-5 flex-1">
            {[
              { name: "Elena Rivas", avatar: "https://i.pravatar.cc/100?u=a", status: "online" },
              { name: "Carlos V.", avatar: "https://i.pravatar.cc/100?u=b", status: "online" },
              { name: "Lucía Mendes", avatar: "https://i.pravatar.cc/100?u=c", status: "away" },
            ].map((member) => (
              <div key={member.name} className="flex items-center space-x-4 group cursor-pointer">
                <div className="relative">
                  <img
                    src={member.avatar}
                    className="w-11 h-11 rounded-2xl shadow-sm grayscale group-hover:grayscale-0 transition-all"
                    alt="avatar"
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-4 border-white rounded-full ${
                      member.status === "online" ? "bg-green-500" : "bg-slate-300"
                    }`}
                  />
                </div>
                <span className={`text-sm font-bold ${member.status === "online" ? "text-slate-700" : "text-slate-400"}`}>
                  {member.name}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full py-4 mt-6 text-indigo-600 text-sm font-black border-2 border-indigo-50 rounded-[1.5rem] hover:bg-indigo-50 transition-all active:scale-95">
            Ver todos (142)
          </button>
        </div>

        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
          <h3 className="font-bold text-lg mb-4 relative z-10">Anuncio Pro</h3>
          <p className="text-slate-300 text-sm font-medium leading-relaxed mb-6 relative z-10">
            La conferencia de Diseño Sistémico comienza en 2 horas. No olvides tu cuaderno digital.
          </p>
          <button className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold text-sm relative z-10 hover:bg-indigo-50 transition-colors">
            Recordarme
          </button>
        </div>
      </aside>
    </div>
  );
}
