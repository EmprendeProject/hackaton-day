import { Router } from "express";
import supabase from "../lib/supabase";

const router = Router();

router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const cursor = req.query.cursor as string | undefined;
  const userId = req.query.userId as string | undefined;

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
    if (likesError) {
      console.error("[GET /api/posts] Error fetching likes:", likesError.message);
    }
    likedPostIds = new Set((likes ?? []).map((l: any) => l.post_id));
  }

  const postsWithLiked = posts.map((p: any) => ({
    ...p,
    likes: Number(p.likes),
    comments: Number(p.comments),
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
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data: fullPost, error: viewError } = await supabase
    .from("posts_view")
    .select("*")
    .eq("id", data.id)
    .single();

  if (viewError || !fullPost) {
    return res.status(500).json({ error: "Error fetching created post" });
  }

  res.status(201).json({
    ...fullPost,
    likes: 0,
    comments: 0,
    userHasLiked: false,
  });
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
    const { error } = await supabase.from("post_likes").delete().eq("id", existing.id);
    if (error) return res.status(500).json({ error: error.message });
  } else {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: id, user_id: userId });
    if (error) return res.status(500).json({ error: error.message });
  }

  const { count } = await supabase
    .from("post_likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", id);

  res.json({ liked: !existing, likes: count ?? 0 });
});

function buildCommentTree(flat: any[]): any[] {
  const map = new Map<string, any>();
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  const roots: any[] = [];
  map.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id).replies.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

router.get("/:id/comments", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId as string | undefined;

  const { data, error } = await supabase.rpc("get_post_comments", { p_post_id: id });
  if (error) return res.status(500).json({ error: error.message });

  const flat = data ?? [];

  let userReactionMap = new Map<string, string>();
  if (userId && flat.length > 0) {
    const commentIds = flat.map((c: any) => c.id);
    const { data: userReactions } = await supabase
      .from("comment_reactions")
      .select("comment_id, reaction_type")
      .eq("user_id", userId)
      .in("comment_id", commentIds);
    userReactionMap = new Map(
      (userReactions ?? []).map((r: any) => [r.comment_id, r.reaction_type])
    );
  }

  const withReactions = flat.map((c: any) => ({
    ...c,
    reactions: c.reactions ?? {},
    userReaction: userReactionMap.get(c.id) ?? null,
  }));

  res.json(buildCommentTree(withReactions));
});

router.post("/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content, userId, parentId } = req.body;

  if (!content?.trim()) return res.status(400).json({ error: "Contenido requerido" });
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: id,
      user_id: userId,
      content: content.trim(),
      parent_id: parentId ?? null,
    })
    .select("id, post_id, parent_id, user_id, content, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, avatar")
    .eq("id", userId)
    .single();

  res.status(201).json({
    ...data,
    author: profile?.name ?? "Anónimo",
    role: profile?.role ?? "student",
    avatar: profile?.avatar ?? null,
    reactions: {},
    userReaction: null,
    replies: [],
  });
});

router.post("/:postId/comments/:commentId/react", async (req, res) => {
  const { commentId } = req.params;
  const { userId, reactionType } = req.body;

  if (!userId) return res.status(400).json({ error: "userId requerido" });
  if (!reactionType) return res.status(400).json({ error: "reactionType requerido" });

  const { data: existing } = await supabase
    .from("comment_reactions")
    .select("id, reaction_type")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      // mismo tipo → quitar reacción
      await supabase.from("comment_reactions").delete().eq("id", existing.id);
    } else {
      // distinto tipo → cambiar reacción
      await supabase
        .from("comment_reactions")
        .update({ reaction_type: reactionType })
        .eq("id", existing.id);
    }
  } else {
    await supabase
      .from("comment_reactions")
      .insert({ comment_id: commentId, user_id: userId, reaction_type: reactionType });
  }

  const { data: counts } = await supabase
    .from("comment_reactions")
    .select("reaction_type")
    .eq("comment_id", commentId);

  const reactions = (counts ?? []).reduce((acc: Record<string, number>, r: any) => {
    acc[r.reaction_type] = (acc[r.reaction_type] ?? 0) + 1;
    return acc;
  }, {});

  const userReaction =
    existing?.reaction_type === reactionType ? null : reactionType;

  res.json({ reactions, userReaction });
});

export default router;
