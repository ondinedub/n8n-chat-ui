import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const { PORT = 3000, ACCESS_CODE, N8N_WEBHOOK_URL, N8N_WEBHOOK_TOKEN } = process.env;

// Répondre sur / et /healthz (health check Koyeb)
app.get("/", (_, res) => res.send("ok"));
app.get("/healthz", (_, res) => res.send("ok"));

// Auth simple optionnelle via code d'accès
app.use("/api", (req, res, next) => {
  if (!ACCESS_CODE) return next();
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${ACCESS_CODE}`) return res.status(401).json({ error: "unauthorized" });
  next();
});

app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body || {};
  if (!message) return res.status(400).json({ error: "message required" });

  const r = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(N8N_WEBHOOK_TOKEN ? { "x-api-key": N8N_WEBHOOK_TOKEN } : {})
    },
    body: JSON.stringify({ message, sessionId })
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) return res.status(502).json({ error: "n8n error", details: data });
  res.json(data); // attendu: { reply: "..." }
});

app.listen(PORT, () => console.log(`listening on ${PORT}`));
