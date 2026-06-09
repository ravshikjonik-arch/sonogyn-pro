/**
 * Chat API for "Чат врачей УЗД": registration, login (JWT), cases + comments, optional image upload.
 * Run: cd server && npm install && npm start
 * Env: PORT=3100 JWT_SECRET=change-me-in-production
 */
import crypto from "crypto";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { rateLimit } from "express-rate-limit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "data", "store.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

const PORT = Number(process.env.PORT) || 3100;
const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET_ENV = process.env.JWT_SECRET;
const JWT_SECRET =
  JWT_SECRET_ENV ||
  (isProduction
    ? null
    : "dev-only-change-in-production");
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";
const MIN_JWT_SECRET_LEN = 32;
if (!JWT_SECRET) {
  console.error("Refusing to start: set JWT_SECRET in production (NODE_ENV=production).");
  process.exit(1);
}
if (isProduction && JWT_SECRET.length < MIN_JWT_SECRET_LEN) {
  console.error(`Refusing to start: JWT_SECRET must be at least ${MIN_JWT_SECRET_LEN} chars in production.`);
  process.exit(1);
}
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_USER_ID = String(process.env.ADMIN_USER_ID || "").trim();

function ensureDirs() {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function loadStore() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { users: [], cases: [] };
  }
}

function saveStore(store) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2), "utf8");
}

ensureDirs();
let store = loadStore();

function normalizeStoreShape() {
  store.users = (store.users || []).map((u) => ({
    ...u,
    role: u.role === "admin" ? "admin" : "doctor",
    isBlocked: Boolean(u.isBlocked),
    blockedReason: String(u.blockedReason || ""),
    blockedUntil: u.blockedUntil || null,
    tokenVersion: Number.isFinite(u.tokenVersion) ? u.tokenVersion : 0,
  }));
  store.cases = store.cases || [];
  store.audit = store.audit || [];
}

function signUserToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.displayName,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES },
  );
}

function bumpTokenVersion(user) {
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
}

function addAudit(action, actorId, details = {}) {
  store.audit = store.audit || [];
  store.audit.unshift({
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    action,
    actorId,
    details,
    createdAt: new Date().toISOString(),
  });
  if (store.audit.length > 2000) {
    store.audit = store.audit.slice(0, 2000);
  }
}

function applyEnvAdminPromotion() {
  if (!ADMIN_EMAIL && !ADMIN_USER_ID) return;
  let changed = false;
  for (const u of store.users || []) {
    const matchEmail = ADMIN_EMAIL && String(u.email || "").toLowerCase() === ADMIN_EMAIL;
    const matchId = ADMIN_USER_ID && String(u.id || "") === ADMIN_USER_ID;
    const shouldAdmin = Boolean(matchEmail || matchId);
    if (shouldAdmin && u.role !== "admin") {
      u.role = "admin";
      addAudit("admin_promoted_boot", "system", { userId: u.id, email: u.email });
      changed = true;
    }
  }
  if (changed) saveStore(store);
}

function refreshAdminRoleForUser(user) {
  if (!user) return false;
  if (!ADMIN_EMAIL && !ADMIN_USER_ID) return false;
  const matchEmail = ADMIN_EMAIL && String(user.email || "").toLowerCase() === ADMIN_EMAIL;
  const matchId = ADMIN_USER_ID && String(user.id || "") === ADMIN_USER_ID;
  const shouldAdmin = Boolean(matchEmail || matchId);
  if (shouldAdmin && user.role !== "admin") {
    user.role = "admin";
    addAudit("admin_promoted_runtime", "system", { userId: user.id, email: user.email });
    saveStore(store);
    return true;
  }
  return false;
}

function userPublicDto(u) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role === "admin" ? "admin" : "doctor",
    isBlocked: Boolean(u.isBlocked),
    blockedReason: String(u.blockedReason || ""),
    blockedUntil: u.blockedUntil || null,
    createdAt: u.createdAt,
  };
}

function isActiveBlock(u) {
  if (!u?.isBlocked) return false;
  if (!u.blockedUntil) return true;
  const untilTs = new Date(u.blockedUntil).getTime();
  if (!Number.isFinite(untilTs)) return true;
  if (untilTs > Date.now()) return true;
  u.isBlocked = false;
  u.blockedReason = "";
  u.blockedUntil = null;
  saveStore(store);
  return false;
}

normalizeStoreShape();
applyEnvAdminPromotion();
saveStore(store);

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

const commonLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Слишком много запросов, попробуйте позже" },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Слишком много попыток входа/регистрации" },
});
app.use(commonLimiter);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

function authMiddleware(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Требуется авторизация" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    req.userName = payload.name;
    req.userRole = payload.role === "admin" ? "admin" : "doctor";
    const user = store.users.find((u) => u.id === req.userId);
    if (!user) return res.status(401).json({ error: "Пользователь не найден" });
    if ((payload.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({ error: "Сессия отозвана" });
    }
    if (isActiveBlock(user)) {
      return res.status(403).json({
        error: "Аккаунт заблокирован",
        blockedReason: user.blockedReason || "Нарушение правил сообщества",
        blockedUntil: user.blockedUntil || null,
      });
    }
    next();
  } catch {
    return res.status(401).json({ error: "Недействительный токен" });
  }
}

function adminOnly(req, res, next) {
  const user = store.users.find((u) => u.id === req.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Только для администратора" });
  }
  next();
}

app.post("/auth/register", authLimiter, async (req, res) => {
  const { email, password, displayName } = req.body || {};
  const em = String(email || "").trim().toLowerCase();
  const name = String(displayName || "").trim();
  const pass = String(password || "");
  if (!em || !name || pass.length < 6) {
    return res.status(400).json({ error: "Укажите email, имя и пароль не короче 6 символов" });
  }
  if (store.users.some((u) => u.email === em)) {
    return res.status(409).json({ error: "Пользователь с таким email уже есть" });
  }
  const passwordHash = await bcrypt.hash(pass, 10);
  const user = {
    id: `u_${Date.now()}`,
    email: em,
    passwordHash,
    displayName: name,
    role: em === ADMIN_EMAIL && ADMIN_EMAIL ? "admin" : "doctor",
    isBlocked: false,
    blockedReason: "",
    blockedUntil: null,
    tokenVersion: 0,
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  refreshAdminRoleForUser(user);
  addAudit("user_registered", user.id, { email: user.email, role: user.role });
  saveStore(store);
  const token = signUserToken(user);
  res.json({
    token,
    user: userPublicDto(user),
  });
});

app.post("/auth/login", authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  const em = String(email || "").trim().toLowerCase();
  const user = store.users.find((u) => u.email === em);
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
    return res.status(401).json({ error: "Неверный email или пароль" });
  }
  if (isActiveBlock(user)) {
    return res.status(403).json({
      error: "Аккаунт заблокирован",
      blockedReason: user.blockedReason || "Нарушение правил сообщества",
      blockedUntil: user.blockedUntil || null,
    });
  }
  refreshAdminRoleForUser(user);
  const token = signUserToken(user);
  res.json({
    token,
    user: userPublicDto(user),
  });
});

app.get("/auth/me", authMiddleware, (req, res) => {
  const user = store.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "Пользователь не найден" });
  refreshAdminRoleForUser(user);
  res.json(userPublicDto(user));
});

/** List cases visible to current user: all public + own private */
app.get("/cases", authMiddleware, (req, res) => {
  const uid = req.userId;
  const base = `${req.protocol}://${req.get("host")}`;
  const list = store.cases
    .filter((c) => c.visibility === "public" || c.authorId === uid)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => ({
      id: c.id,
      author: c.authorName,
      authorId: c.authorId,
      title: c.title,
      description: c.description,
      imageUri: c.imageFilename ? `${base}/uploads/${c.imageFilename}` : null,
      createdAt: c.createdAt,
      visibility: c.visibility,
      tags: c.tags || [],
      comments: (c.comments || []).map((cm) => ({
        id: cm.id,
        author: cm.authorName,
        text: cm.text,
        createdAt: cm.createdAt,
      })),
    }));
  res.json({ cases: list });
});

app.post("/cases", authMiddleware, upload.single("image"), (req, res) => {
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const visibility = req.body.visibility === "private" ? "private" : "public";
  let tags = [];
  try {
    tags = JSON.parse(req.body.tags || "[]");
  } catch {
    tags = String(req.body.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  if (!title || !description) {
    return res.status(400).json({ error: "Нужны заголовок и описание" });
  }

  let imageFilename = null;
  if (req.file && req.file.buffer && req.file.buffer.length) {
    const ext = (req.file.mimetype || "").includes("png") ? "png" : "jpg";
    imageFilename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, imageFilename), req.file.buffer);
  }

  const author = store.users.find((u) => u.id === req.userId);
  const newCase = {
    id: `c_${Date.now()}`,
    authorId: req.userId,
    authorName: author?.displayName || req.userName || "Врач",
    title,
    description,
    imageFilename,
    visibility,
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    comments: [],
  };
  store.cases.unshift(newCase);
  addAudit("case_created", req.userId, { caseId: newCase.id, visibility });
  saveStore(store);

  const base = `${req.protocol}://${req.get("host")}`;
  res.status(201).json({
    case: {
      id: newCase.id,
      author: newCase.authorName,
      title: newCase.title,
      description: newCase.description,
      imageUri: newCase.imageFilename ? `${base}/uploads/${newCase.imageFilename}` : null,
      createdAt: newCase.createdAt,
      visibility: newCase.visibility,
      tags: newCase.tags,
      comments: [],
    },
  });
});

app.post("/cases/:id/comments", authMiddleware, (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) return res.status(400).json({ error: "Пустой комментарий" });
  const c = store.cases.find((x) => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Кейс не найден" });
  if (c.visibility === "private" && c.authorId !== req.userId) {
    return res.status(403).json({ error: "Нет доступа" });
  }
  const author = store.users.find((u) => u.id === req.userId);
  const comment = {
    id: `cm_${Date.now()}`,
    authorId: req.userId,
    authorName: author?.displayName || req.userName || "Врач",
    text,
    createdAt: new Date().toISOString(),
  };
  c.comments = c.comments || [];
  c.comments.push(comment);
  addAudit("comment_added", req.userId, { caseId: c.id, commentId: comment.id });
  saveStore(store);
  res.status(201).json({ comment });
});

app.get("/admin/users", authMiddleware, adminOnly, (_req, res) => {
  const users = [...store.users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(userPublicDto);
  res.json({ users });
});

app.patch("/admin/users/:id/block", authMiddleware, adminOnly, (req, res) => {
  const target = store.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Пользователь не найден" });
  if (target.role === "admin") return res.status(400).json({ error: "Нельзя блокировать администратора" });
  const reason = String(req.body.reason || "").trim();
  const blockedUntilRaw = String(req.body.blockedUntil || "").trim();
  target.isBlocked = true;
  target.blockedReason = reason || "Нарушение правил сообщества";
  target.blockedUntil = blockedUntilRaw || null;
  bumpTokenVersion(target);
  addAudit("user_blocked", req.userId, {
    targetUserId: target.id,
    reason: target.blockedReason,
    blockedUntil: target.blockedUntil,
  });
  saveStore(store);
  res.json({ user: userPublicDto(target) });
});

app.patch("/admin/users/:id/unblock", authMiddleware, adminOnly, (req, res) => {
  const target = store.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Пользователь не найден" });
  target.isBlocked = false;
  target.blockedReason = "";
  target.blockedUntil = null;
  addAudit("user_unblocked", req.userId, { targetUserId: target.id });
  saveStore(store);
  res.json({ user: userPublicDto(target) });
});

app.post("/admin/users/:id/revoke-sessions", authMiddleware, adminOnly, (req, res) => {
  const target = store.users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Пользователь не найден" });
  bumpTokenVersion(target);
  addAudit("user_sessions_revoked", req.userId, { targetUserId: target.id, tokenVersion: target.tokenVersion });
  saveStore(store);
  res.json({ ok: true, tokenVersion: target.tokenVersion });
});

app.delete("/admin/cases/:id", authMiddleware, adminOnly, (req, res) => {
  const idx = store.cases.findIndex((x) => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Кейс не найден" });
  const [removed] = store.cases.splice(idx, 1);
  addAudit("case_deleted_admin", req.userId, { caseId: removed.id, authorId: removed.authorId });
  saveStore(store);
  res.json({ ok: true });
});

app.delete("/admin/cases/:caseId/comments/:commentId", authMiddleware, adminOnly, (req, res) => {
  const c = store.cases.find((x) => x.id === req.params.caseId);
  if (!c) return res.status(404).json({ error: "Кейс не найден" });
  c.comments = c.comments || [];
  const before = c.comments.length;
  c.comments = c.comments.filter((cm) => cm.id !== req.params.commentId);
  if (before === c.comments.length) return res.status(404).json({ error: "Комментарий не найден" });
  addAudit("comment_deleted_admin", req.userId, {
    caseId: c.id,
    commentId: req.params.commentId,
  });
  saveStore(store);
  res.json({ ok: true });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

/** Telegram auth: mobile → bot → poll → session proxy → Supabase */
const telegramPending = new Map();
const WEB_API_BASE_URL = (process.env.WEB_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SONOGYN_AUTH_INTERNAL_SECRET = process.env.SONOGYN_AUTH_INTERNAL_SECRET || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "sonogyn_bot";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

function purgeTelegramPending() {
  const now = Date.now();
  for (const [key, value] of telegramPending) {
    if (now - value.createdAt > 10 * 60 * 1000) telegramPending.delete(key);
  }
}

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  }).catch(() => {});
}

app.post("/auth/telegram/start", (_req, res) => {
  purgeTelegramPending();
  const nonce = crypto.randomUUID();
  telegramPending.set(nonce, { status: "pending", createdAt: Date.now() });
  res.json({
    nonce,
    botUrl: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=login_${nonce}`,
    deepLink: `com.yakrav7700.usriskcalc://auth/callback?telegram_nonce=${nonce}`,
  });
});

app.post("/auth/telegram/complete", (req, res) => {
  const { nonce, id, first_name, last_name, username, photo_url, auth_date, hash } = req.body || {};
  if (!nonce || !telegramPending.has(nonce)) {
    return res.status(404).json({ error: "Сессия Telegram не найдена" });
  }
  telegramPending.set(nonce, {
    status: "ok",
    createdAt: Date.now(),
    payload: { id, first_name, last_name, username, photo_url, auth_date, hash, source: hash ? "widget" : "bot" },
  });
  res.json({ ok: true });
});

app.post("/auth/telegram/session", async (req, res) => {
  purgeTelegramPending();
  const nonce = String(req.body?.nonce || "").trim();
  if (!nonce) {
    return res.status(400).json({ error: "nonce обязателен" });
  }

  const item = telegramPending.get(nonce);
  if (!item || item.status !== "ok" || !item.payload) {
    return res.status(404).json({ error: "Сессия Telegram не найдена или ещё не подтверждена" });
  }

  if (!SONOGYN_AUTH_INTERNAL_SECRET) {
    return res.status(503).json({ error: "SONOGYN_AUTH_INTERNAL_SECRET не задан на chat-server" });
  }

  const payload = item.payload;
  const path = payload.hash ? "/api/auth/telegram" : "/api/auth/telegram/bot";
  const headers = {
    "Content-Type": "application/json",
    "x-sonogyn-client": "mobile",
  };
  if (!payload.hash) {
    headers["x-sonogyn-internal-secret"] = SONOGYN_AUTH_INTERNAL_SECRET;
  }

  try {
    const upstream = await fetch(`${WEB_API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data.session) {
      return res.status(upstream.status || 500).json({
        error: data.error || "Не удалось создать Supabase-сессию",
      });
    }

    telegramPending.delete(nonce);
    return res.json({ ok: true, session: data.session, email: data.email });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(502).json({ error: `Web API недоступен: ${msg}` });
  }
});

app.get("/auth/telegram/poll/:nonce", (req, res) => {
  purgeTelegramPending();
  const item = telegramPending.get(req.params.nonce);
  if (!item) return res.status(404).json({ error: "not found" });
  if (Date.now() - item.createdAt > 10 * 60 * 1000) {
    telegramPending.delete(req.params.nonce);
    return res.json({ status: "expired" });
  }
  if (item.status === "ok") {
    return res.json({ status: "ok", payload: item.payload, nonce: req.params.nonce });
  }
  return res.json({ status: "pending" });
});

/** Telegram Bot API webhook: /start login_{nonce} */
app.post("/auth/telegram/webhook/:secret?", async (req, res) => {
  if (TELEGRAM_WEBHOOK_SECRET && req.params.secret !== TELEGRAM_WEBHOOK_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const update = req.body || {};
  const message = update.message;
  if (!message?.text || !message.from) {
    return res.json({ ok: true });
  }

  const match = message.text.match(/^\/start(?:@\w+)?\s+login_([0-9a-f-]{36})$/i);
  if (!match) {
    if (message.text.startsWith("/start")) {
      await sendTelegramMessage(
        message.chat.id,
        "SonoGyn Pro: откройте вход через приложение → «Войти через Telegram».",
      );
    }
    return res.json({ ok: true });
  }

  const nonce = match[1];
  if (!telegramPending.has(nonce)) {
    await sendTelegramMessage(message.chat.id, "Сессия истекла. Запросите вход в приложении заново.");
    return res.json({ ok: true });
  }

  const from = message.from;
  telegramPending.set(nonce, {
    status: "ok",
    createdAt: Date.now(),
    payload: {
      id: from.id,
      first_name: from.first_name,
      last_name: from.last_name,
      username: from.username,
      source: "bot",
    },
  });

  const deepLink = `com.yakrav7700.usriskcalc://auth/callback?telegram_nonce=${nonce}`;
  await sendTelegramMessage(
    message.chat.id,
    `✅ Подтверждено.\n\nОткройте SonoGyn Pro:\n${deepLink}\n\nЕсли ссылка не открывается — вернитесь в приложение, вход завершится автоматически.`,
  );

  return res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat API listening on http://0.0.0.0:${PORT}`);
});
