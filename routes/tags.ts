import { Router } from "express";
import supabase from "../lib/supabase";

const router = Router();

router.get("/", async (_req, res) => {
  const { data, error } = await supabase.from("tags").select("id, name").order("name");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.post("/", async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: "Nombre requerido" });

  const { data: existing } = await supabase
    .from("tags").select("id, name").eq("name", name.trim().toLowerCase()).maybeSingle();
  if (existing) return res.json(existing);

  const { data, error } = await supabase
    .from("tags").insert({ name: name.trim().toLowerCase() }).select("id, name").single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await supabase.from("post_tags").delete().eq("tag_id", id);
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

export default router;
