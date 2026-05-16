import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

    // Usamos admin para crear el usuario SIN requerir confirmación de email
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,          // <-- confirma el email automáticamente
      user_metadata: { name, role }
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

    // Ahora hacemos sign in para obtener el token
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
        name: data.user.user_metadata.name ?? name,
        email: data.user.email!,
        role: data.user.user_metadata.role ?? role,
        avatar: `https://i.pravatar.cc/150?u=${data.user.id}`
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

    res.json({
      user: {
        id: data.user.id,
        name: data.user.user_metadata.name ?? data.user.email!.split("@")[0],
        email: data.user.email!,
        role: data.user.user_metadata.role ?? "student",
        avatar: `https://i.pravatar.cc/150?u=${data.user.id}`
      },
      token: data.session.access_token
    });
  });

  // ──────────────────────────────────────────────
  // PROFILE
  // ──────────────────────────────────────────────
  app.put("/api/auth/profile", async (req, res) => {
    const { id, name, avatar, bio } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const { data, error } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: { name, avatar, bio }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      user: {
        id: data.user.id,
        name: data.user.user_metadata.name ?? data.user.email!.split("@")[0],
        email: data.user.email!,
        role: data.user.user_metadata.role ?? "student",
        avatar: data.user.user_metadata.avatar ?? `https://i.pravatar.cc/150?u=${data.user.id}`,
        bio: data.user.user_metadata.bio ?? ""
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
      .from("posts")
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
    const { content, author, avatar } = req.body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "El contenido es requerido" });
    }

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author: author ?? "Anónimo",
        role: "Estudiante",
        content: content.trim(),
        likes: 0,
        comments: 0,
        avatar: avatar ?? `https://i.pravatar.cc/150?u=${Date.now()}`
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating post:", error.message);
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(data);
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

    await supabase.from("posts").update({ likes: count ?? 0 }).eq("id", id);

    res.json({ liked: !existing, likes: count ?? 0 });
  });

  // ──────────────────────────────────────────────
  // COMMENTS
  // ──────────────────────────────────────────────
  app.get("/api/posts/:id/comments", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data ?? []);
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    const { id } = req.params;
    const { content, author, avatar } = req.body;

    if (!content?.trim()) return res.status(400).json({ error: "Contenido requerido" });

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: id, content: content.trim(), author: author ?? "Anónimo", avatar })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const { count } = await supabase
      .from("post_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    await supabase.from("posts").update({ comments: count ?? 0 }).eq("id", id);

    res.status(201).json(data);
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
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

startServer();
