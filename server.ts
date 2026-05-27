import "dotenv/config";
import "express-async-errors";
import express from "express";
import path from "path";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import coursesRouter from "./routes/courses";
import tagsRouter from "./routes/tags";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/tags", tagsRouter);

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

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

export default app;
