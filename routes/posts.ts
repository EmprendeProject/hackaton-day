import { Router } from "express";
import supabase from "../lib/supabase";

const router = Router();

router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const cursor = req.query.cursor as string | undefined;
  const userId = req.query.userId as string | undefined;
  console.log("[GET /api/posts] userId recibido:", userId ?? "(ninguno)");

  let query = supabase
    .from("posts_view")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching posts:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const posts = data ?? [];

  let likedPostIds = new Set<string>();
  if (userId && posts.length > 0) {
    const postIds = posts.map((p: any) => p.id);
    const { data: likes, error: likesError } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", userId)
      .in("post_id", postIds);
    if (likesError) console.error("Error fetching likes:", likesError.message);
    likedPostIds = new Set((likes ?? []).map((l: any) => l.post_id));
  }

  const postsWithLiked = posts.map((p: any) => ({
    ...p,
    userHasLiked: likedPostIds.has(p.id),
  }));

  const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

  res.json({ posts: postsWithLiked, nextCursor });
});

router.post("/", async (req, res) => {
  const { content, userId } = req.body;

  if (!content || typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ error: "El contenido es requerido" });
  }
  if (!userId) {
    return res.status(400).json({ error: "userId es requerido" });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ user_id: userId, content: content.trim() })
    .select("id, user_id, content, created_at")
    .single();

  if (error) {
    console.error("Error creating post:", JSON.stringify(error));
    return res.status(500).json({ error: error.message });
  }

  const { data: fullPost } = await supabase
    .from("posts_view")
    .select("*")
    .eq("id", data.id)
    .single();

  res.status(201).json(fullPost ?? data);
});

router.post("/:id/like", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error: deleteError } = await supabase.from("post_likes").delete().eq("id", existing.id);
    if (deleteError) {
      console.error("[like] Error eliminando like:", deleteError);
      return res.status(500).json({ error: deleteError.message });
    }
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("post_likes")
      .insert({ post_id: id, user_id: userId })
      .select();
    console.log("[like] Insert resultado:", JSON.stringify({ inserted, insertError }));
    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
  }

  const { count, error: countError } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", id);
  console.log("[like] Count resultado:", JSON.stringify({ count, countError }));

  res.json({ liked: !existing, likes: count ?? 0 });
});

async function attachProfiles(comments: any[]) {
  if (comments.length === 0) return [];
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, avatar")
    .in("id", userIds);
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return comments.map((c) => ({
    id: c.id,
    post_id: c.post_id,
    user_id: c.user_id,
    content: c.content,
    created_at: c.created_at,
    author: profileMap.get(c.user_id)?.name ?? "Anónimo",
    avatar: profileMap.get(c.user_id)?.avatar ?? null,
  }));
}

router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("post_comments")
    .select("id, post_id, user_id, content, created_at")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  res.json(await attachProfiles(data ?? []));
});

router.post("/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content, userId } = req.body;

  if (!content?.trim()) return res.status(400).json({ error: "Contenido requerido" });
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: id, user_id: userId, content: content.trim() })
    .select("id, post_id, user_id, content, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const [comment] = await attachProfiles([data]);
  res.status(201).json(comment);
});

export default router;
