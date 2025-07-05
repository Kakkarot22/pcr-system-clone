"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const https = require("http");
const helmet = require("helmet");
const app = express();
const server = https.createServer(app);
const iooptions = {
  serveClient: process.env.ENV_TEST ? true : false,
  path: "/socket.io",
  cors: {
    origin: process.env.ENV_TEST
      ? "http://localhost:3000"
      : `https://${process.env.SITE_URI}`,
  },
};
exports.io = require("socket.io")(server, iooptions);
exports.io.on("connection", (s) => {});
const models_1 = require("./backend/models");
var SequelizeSessionStore = require("connect-session-sequelize")(session.Store);
const routes_1 = require("./backend/routes");
const index_1 = require("./backend/utility/index");
process.on("unhandledRejection", function (err) {
  (0,
  index_1.writeLog)(JSON.stringify({ msg: "unhandled rejection", err: err }), "crit");
  process.exit(1);
});
process.on("uncaughtException", function (err) {
  (0,
  index_1.writeLog)(JSON.stringify({ msg: "uncaught exception", err: err }), "crit");
  process.exit(1);
});
process.on("exit", (code) => {
  if (code) {
    (0, index_1.writeLog)(
      JSON.stringify({ msg: "process exit", stack: code }),
      "crit"
    );
    process.exit(1);
  }
});
const corsOptions = {
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "X-Access-Token",
    "Authorization",
  ],
  credentials: true,
  methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
  origin: process.env.ENV_TEST
    ? "http://localhost:3000"
    : [
        `https://${process.env.SITE_URI}`,
        "https://status-check.testweb-demo.com",
      ],
  preflightContinue: false,
};
app.use(cors(corsOptions));
app.use(
  helmet({ contentSecurityPolicy: false }),
  express.json(),
  express.urlencoded({ extended: true }),
  session({
    secret: process.env.SESS_SEC,
    store: new SequelizeSessionStore({
      db: models_1.db.sequelize,
      checkExpirationInterval: 60 * 60 * 1000,
    }),
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "lax",
      maxAge: 86400000 * 7,
    },
  })
);
app.use(express.static(path.join(__dirname, "frontend", "build")));
app.use("/api", routes_1.router);
app.use(express.static(path.join(__dirname, "public")));
app.get("/*", (req, res) => {
  res.sendFile(
    path.join(__dirname, "frontend", "build", "index.html"),
    function (err) {
      if (err) {
        res.status(500).send(err);
      }
    }
  );
});
const PORT = process.env.PORT;
app.set("port", PORT);
server.listen(PORT);
console.log(`Server is running on port ${PORT}`);
let isProduction = process.env.NODE_ENV == "production";
models_1.db.sequelize
  .sync({ alter: !isProduction })
  .then(() => {
    return index_1.CustomTaskScheduler.runMessageNotification();
  })
  .catch((e) => {
    console.warn(e);
    throw e;
  });
