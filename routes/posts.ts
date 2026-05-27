import { Router } from "express";
import supabase from "../lib/supabase";

const router = Router();

router.get("/", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const cursor = req.query.cursor as string | undefined;
  const userId = req.query.userId as string | undefined;
  const tagsParam = req.query.tags as string | undefined;
  const tagNames = tagsParam ? tagsParam.split(",").filter(Boolean) : [];

  let query = supabase
    .from("posts_view")
    .select("*")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt("created_at", cursor);
  if (tagNames.length > 0) query = query.overlaps("tags", tagNames);

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const posts = data ?? [];

  let userReactionMap = new Map<string, string>();
  let reactionsCountMap = new Map<string, Record<string, number>>();

  if (posts.length > 0) {
    const postIds = posts.map((p: any) => p.id);

    const { data: allReactions } = await supabase
      .from("post_reactions")
      .select("post_id, reaction_type, user_id")
      .in("post_id", postIds);

    for (const r of allReactions ?? []) {
      const map = reactionsCountMap.get(r.post_id) ?? {};
      map[r.reaction_type] = (map[r.reaction_type] ?? 0) + 1;
      reactionsCountMap.set(r.post_id, map);
      if (userId && r.user_id === userId) userReactionMap.set(r.post_id, r.reaction_type);
    }
  }

  const postsWithLiked = posts.map((p: any) => ({
    ...p,
    likes: Number(p.likes),
    comments: Number(p.comments),
    userReaction: userReactionMap.get(p.id) ?? null,
    reactions: reactionsCountMap.get(p.id) ?? {},
  }));

  const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

  res.json({ posts: postsWithLiked, nextCursor });
});

async function uploadPostImage(imageData: string, postId: string): Promise<string | null> {
  const matches = imageData.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;
  const mimeType = matches[1];
  const ext = mimeType.split("/")[1] ?? "jpg";
  const buffer = Buffer.from(matches[2], "base64");
  const filePath = `post-${postId}.${ext}`;
  const { error } = await supabase.storage.from("Post").upload(filePath, buffer, { contentType: mimeType, upsert: true });
  if (error) return null;
  const { data } = supabase.storage.from("Post").getPublicUrl(filePath);
  return data?.publicUrl ?? null;
}

router.post("/", async (req, res) => {
  const { content, userId, tagIds, imageData } = req.body;

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
    console.error("[POST /api/posts] insert error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  if (imageData) {
    const imageUrl = await uploadPostImage(imageData, data.id);
    if (imageUrl) await supabase.from("posts").update({ image_url: imageUrl }).eq("id", data.id);
  }

  if (Array.isArray(tagIds) && tagIds.length > 0) {
    await supabase.from("post_tags").insert(tagIds.map((tag_id: string) => ({ post_id: data.id, tag_id })));
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
    userReaction: null,
    reactions: {},
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const { data: post } = await supabase.from("posts").select("user_id").eq("id", id).single();
  if (!post) return res.status(404).json({ error: "Post no encontrado" });
  if (post.user_id !== userId) return res.status(403).json({ error: "Sin permiso" });

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { userId, content, imageData, removeImage, tagIds } = req.body;
  if (!userId) return res.status(400).json({ error: "userId requerido" });
  if (!content?.trim()) return res.status(400).json({ error: "Contenido requerido" });

  const { data: post } = await supabase.from("posts").select("user_id").eq("id", id).single();
  if (!post) return res.status(404).json({ error: "Post no encontrado" });
  if (post.user_id !== userId) return res.status(403).json({ error: "Sin permiso" });

  const updates: Record<string, any> = { content: content.trim() };

  if (removeImage) {
    updates.image_url = null;
  } else if (imageData) {
    const imageUrl = await uploadPostImage(imageData, id);
    if (imageUrl) updates.image_url = imageUrl;
  }

  const { error } = await supabase.from("posts").update(updates).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });

  if (Array.isArray(tagIds)) {
    await supabase.from("post_tags").delete().eq("post_id", id);
    if (tagIds.length > 0) {
      await supabase.from("post_tags").insert(tagIds.map((tag_id: string) => ({ post_id: id, tag_id })));
    }
  }

  const { data: updatedView } = await supabase.from("posts_view").select("tags").eq("id", id).single();

  res.json({
    updated: true,
    content: content.trim(),
    image_url: updates.image_url !== undefined ? updates.image_url : undefined,
    tags: updatedView?.tags ?? undefined,
  });
});

router.post("/:id/pin", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const { data: post } = await supabase.from("posts").select("user_id, pinned").eq("id", id).single();
  if (!post) return res.status(404).json({ error: "Post no encontrado" });
  if (post.user_id !== userId) return res.status(403).json({ error: "Sin permiso" });

  const { error } = await supabase.from("posts").update({ pinned: !post.pinned }).eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ pinned: !post.pinned });
});

router.post("/:id/react", async (req, res) => {
  const { id } = req.params;
  const { userId, reactionType } = req.body;

  if (!userId) return res.status(400).json({ error: "userId requerido" });
  if (!reactionType) return res.status(400).json({ error: "reactionType requerido" });

  const { data: existing } = await supabase
    .from("post_reactions")
    .select("id, reaction_type")
    .eq("post_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      await supabase.from("post_reactions").delete().eq("id", existing.id);
    } else {
      await supabase.from("post_reactions").update({ reaction_type: reactionType }).eq("id", existing.id);
    }
  } else {
    await supabase.from("post_reactions").insert({ post_id: id, user_id: userId, reaction_type: reactionType });
  }

  const { data: counts } = await supabase
    .from("post_reactions")
    .select("reaction_type")
    .eq("post_id", id);

  const reactions = (counts ?? []).reduce((acc: Record<string, number>, r: any) => {
    acc[r.reaction_type] = (acc[r.reaction_type] ?? 0) + 1;
    return acc;
  }, {});

  const userReaction = existing?.reaction_type === reactionType ? null : reactionType;

  res.json({ reactions, userReaction });
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

router.get("/:postId/comments/:commentId/reactions", async (req, res) => {
  const { commentId } = req.params;
  const { data, error } = await supabase
    .from("comment_reactions")
    .select("reaction_type, user_id, profiles(name, avatar)")
    .eq("comment_id", commentId)
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json((data ?? []).map((r: any) => ({
    reaction_type: r.reaction_type,
    name: r.profiles?.name ?? "Anónimo",
    avatar: r.profiles?.avatar ?? null,
  })));
});

router.get("/:id/reactions", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("post_reactions")
    .select("reaction_type, user_id, profiles(name, avatar)")
    .eq("post_id", id)
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  const result = (data ?? []).map((r: any) => ({
    reaction_type: r.reaction_type,
    name: r.profiles?.name ?? "Anónimo",
    avatar: r.profiles?.avatar ?? null,
  }));

  res.json(result);
});

export default router;
