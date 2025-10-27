// ESM kullanıyorsun: backend/package.json içine "type":"module" ekli olmalı.
import express from "express";
import cors from "cors";
import pool from "./db.js";

const app = express();
app.use(express.json());

// Frontend domainini whitelist et
app.use(
  cors({
    origin: [
      "https://yagmusappv100-frontend-production.up.railway.app",
      // gerekirse ek domainler: "https://yagmusapp.com"
    ],
    // cookie ile auth yoksa credentials gerekmez
  })
);

// Sağlık
app.get("/api/health", (req, res) => res.json({ ok: true }));

// NOTLARI LİSTELE — tek şema: {id,userId,username,content,createdAt}
app.get("/api/notes", async (req, res, next) => {
  try {
    const q = `
      SELECT n.id,
             n.user_id      AS "userId",
             n.content,
             n.created_at   AS "createdAt",
             COALESCE(u.username, '') AS "username"
      FROM notes n
      LEFT JOIN users u ON u.id = n.user_id
      ORDER BY n.created_at DESC
    `;
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (e) { next(e); }
});

// NOT EKLE — aynı şemayla geri döner
app.post("/api/notes", async (req, res, next) => {
  try {
    const { userId, content } = req.body; // token decode etmiyorsan body’den geliyor
    const ins = `
      INSERT INTO notes (user_id, content)
      VALUES ($1, $2)
      RETURNING id,
                user_id    AS "userId",
                content,
                created_at AS "createdAt"
    `;
    const r1 = await pool.query(ins, [userId, content]);

    const sel = `
      SELECT n.id, n."userId", n.content, n."createdAt",
             COALESCE(u.username, '') AS "username"
      FROM (SELECT $1::int AS "userId", $2::text AS content, $3::timestamp AS "createdAt", $4::int AS id) n
      LEFT JOIN users u ON u.id = n."userId"
    `;
    const r2 = await pool.query(sel, [
      r1.rows[0].userId,
      r1.rows[0].content,
      r1.rows[0].createdAt,
      r1.rows[0].id,
    ]);

    res.status(201).json(r2.rows[0]);
  } catch (e) { next(e); }
});

// Hata yakalayıcı
app.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("API on", PORT));
