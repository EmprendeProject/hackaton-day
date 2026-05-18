import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

  // ──────────────────────────────────────────────
  // REGISTRO
  // ──────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role = "student" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son requeridos" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        return res.status(400).json({ error: "Este email ya está registrado. Intenta iniciar sesión." });
      }
      return res.status(400).json({ error: error.message });
    }
    if (!data.user) {
      return res.status(400).json({ error: "No se pudo crear la cuenta" });
    }

    const defaultAvatar = `https://i.pravatar.cc/150?u=${data.user.id}`;
    const { data: profileData, error: profileInsertError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, name, role, avatar: defaultAvatar, bio: "" })
      .select()
      .single();
    console.log("Profile insert →", { profileData, profileInsertError });
    if (profileInsertError) {
      return res.status(500).json({ error: `Error creando perfil: ${profileInsertError.message}` });
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !signInData.session) {
      return res.status(201).json({
        requiresEmailConfirmation: false,
        message: "Cuenta creada con éxito. Ya puedes iniciar sesión.",
        autoLogin: false
      });
    }

    res.status(201).json({
      user: {
        id: data.user.id,
        name,
        email: data.user.email!,
        role,
        avatar: defaultAvatar,
        bio: ""
      },
      token: signInData.session.access_token
    });
  });

  // ──────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return res.status(401).json({ error: "Debes confirmar tu email antes de iniciar sesión." });
      }
      if (error.message.includes("Invalid login credentials")) {
        return res.status(401).json({ error: "Email o contraseña incorrectos." });
      }
      return res.status(401).json({ error: error.message });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role, avatar, bio")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        name: data.user.email!.split("@")[0],
        role: "student",
        avatar: `https://i.pravatar.cc/150?u=${data.user.id}`,
        bio: ""
      });
    }

    res.json({
      user: {
        id: data.user.id,
        name: profile?.name ?? data.user.email!.split("@")[0],
        email: data.user.email!,
        role: profile?.role ?? "student",
        avatar: profile?.avatar ?? `https://i.pravatar.cc/150?u=${data.user.id}`,
        bio: profile?.bio ?? ""
      },
      token: data.session.access_token
    });
  });

  // ──────────────────────────────────────────────
  // AVATAR — sube imagen al bucket Avatars
  // ──────────────────────────────────────────────
  app.post("/api/auth/avatar", async (req, res) => {
    const { userId, imageData } = req.body;

    if (!userId || !imageData) {
      return res.status(400).json({ error: "userId e imageData son requeridos" });
    }

    // imageData viene como "data:image/jpeg;base64,..."
    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: "Formato de imagen inválido" });
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = `avatar-${userId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("Avatars")
      .upload(filePath, buffer, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: publicData } = supabase.storage
      .from("Avatars")
      .getPublicUrl(filePath);

    if (!publicData?.publicUrl) {
      return res.status(500).json({ error: "No se pudo generar la URL de la imagen" });
    }

    res.json({ url: publicData.publicUrl });
  });

  // ──────────────────────────────────────────────
  // PROFILE
  // ──────────────────────────────────────────────
  app.put("/api/auth/profile", async (req, res) => {
    const { id, name, avatar, bio } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data: updated, error: profileError } = await supabase
      .from("profiles")
      .update({ name, avatar, bio, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("name, role, avatar, bio")
      .single();

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(id);

    res.json({
      user: {
        id,
        name: updated.name,
        email: authUser?.user?.email ?? "",
        role: updated.role,
        avatar: updated.avatar,
        bio: updated.bio
      }
    });
  });

  // ──────────────────────────────────────────────
  // POSTS
  // ──────────────────────────────────────────────
  app.get("/api/posts", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const cursor = req.query.cursor as string | undefined;

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
    const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

    res.json({ posts, nextCursor });
  });

  app.post("/api/posts", async (req, res) => {
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
      .select("id, user_id, content, tags, created_at")
      .single();

    if (error) {
      console.error("Error creating post:", error.message);
      return res.status(500).json({ error: error.message });
    }

    // Devolver con los campos del view para consistencia
    const { data: fullPost } = await supabase
      .from("posts_view")
      .select("*")
      .eq("id", data.id)
      .single();

    res.status(201).json(fullPost ?? data);
  });

  // ──────────────────────────────────────────────
  // LIKES
  // ──────────────────────────────────────────────
  app.post("/api/posts/:id/like", async (req, res) => {
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
      await supabase.from("post_likes").delete().eq("id", existing.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: id, user_id: userId });
    }

    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    res.json({ liked: !existing, likes: count ?? 0 });
  });

  // ──────────────────────────────────────────────
  // COMMENTS
  // ──────────────────────────────────────────────
  app.get("/api/posts/:id/comments", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("post_comments")
      .select("id, post_id, user_id, content, created_at, profiles(name, avatar)")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const comments = (data ?? []).map((c: any) => ({
      id: c.id,
      post_id: c.post_id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      author: c.profiles?.name ?? "Anónimo",
      avatar: c.profiles?.avatar ?? null
    }));

    res.json(comments);
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    const { id } = req.params;
    const { content, userId } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: "Contenido requerido" });
    if (!userId) return res.status(400).json({ error: "userId requerido" });

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: id, user_id: userId, content: content.trim() })
      .select("id, post_id, user_id, content, created_at, profiles(name, avatar)")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.status(201).json({
      id: data.id,
      post_id: data.post_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      author: (data as any).profiles?.name ?? "Anónimo",
      avatar: (data as any).profiles?.avatar ?? null
    });
  });

  // ──────────────────────────────────────────────
  // COURSES
  // ──────────────────────────────────────────────
  app.get("/api/courses", async (_req, res) => {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching courses:", error.message);
      return res.status(500).json({ error: error.message });
    }
    res.json(data ?? []);
  });

  // ──────────────────────────────────────────────
  // VITE / STATIC
  // ──────────────────────────────────────────────
  // ──────────────────────────────────────────────
  // VITE / STATIC
  // ──────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    import("vite").then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      }).then((vite) => {
        app.use(vite.middlewares);
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`✅ Server running on http://localhost:${PORT}`);
        });
      });
    });
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  }

export default app;
