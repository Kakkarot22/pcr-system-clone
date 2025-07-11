"use strict";
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const https = require("http");
const helmet = require("helmet");
const SequelizeSessionStore = require("connect-session-sequelize")(
  session.Store
);

const { db } = require("./backend/models");
const { router } = require("./backend/routes");
const { writeLog, CustomTaskScheduler } = require("./backend/utility/index");

const app = express();
const server = https.createServer(app);

// ✅ Required for trusting Render/Vercel proxies (needed for cookie/session to work properly)
app.set("trust proxy", 1);

// ✅ CORS configuration
const corsOptions = {
  origin: ["https://pcr-system-clone.vercel.app", "http://localhost:3000"],
  credentials: true,
  methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "X-Access-Token",
    "Authorization",
  ],
  preflightContinue: false,
};

app.use(cors(corsOptions));

// ✅ Optional but useful fallback in some Render cases
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Session setup
app.use(
  session({
    secret: process.env.SESS_SEC,
    store: new SequelizeSessionStore({
      db: db.sequelize,
      checkExpirationInterval: 60 * 60 * 1000,
    }),
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "none", // Required for cross-origin cookies (Vercel + Render)
      secure: true, // Required for HTTPS (Render)
      maxAge: 86400000 * 7, // 7 days
    },
  })
);

// ✅ Static and API routes
app.use(express.static(path.join(__dirname, "frontend", "build")));
app.use("/api", router);
app.use(express.static(path.join(__dirname, "public")));

app.get("/*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend", "build", "index.html"),
    function (err) {
      if (err) res.status(500).send(err);
    }
  );
});

// ✅ Socket.io
const io = require("socket.io")(server, {
  serveClient: false,
  path: "/socket.io",
  cors: {
    origin: ["https://pcr-system-clone.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
io.on("connection", (socket) => {
  console.log("Socket connected: " + socket.id);
});
exports.io = io;

// ✅ Error handlers
process.on("unhandledRejection", (err) => {
  writeLog(JSON.stringify({ msg: "unhandled rejection", err }), "crit");
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  writeLog(JSON.stringify({ msg: "uncaught exception", err }), "crit");
  process.exit(1);
});
process.on("exit", (code) => {
  if (code) {
    writeLog(JSON.stringify({ msg: "process exit", stack: code }), "crit");
    process.exit(1);
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.set("port", PORT);
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Sync DB and run any tasks
const isProduction = process.env.NODE_ENV === "production";
db.sequelize
  .sync({ alter: !isProduction })
  .then(() => CustomTaskScheduler.runMessageNotification())
  .catch((e) => {
    console.warn(e);
    throw e;
  });
