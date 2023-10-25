require("dotenv").config();
import * as express from "express"
import * as path from "path";
import * as cors from "cors";
import * as session from "express-session";
import * as https from "http";
import * as socketio from "socket.io";
import helmet = require("helmet");
const app = express();
const server = https.createServer(app)
const iooptions = {
    serveClient: process.env.ENV_TEST ? true : false,
    path: "/socket.io",
    cors: { origin: process.env.ENV_TEST ? "http://localhost:3000" : `https://${process.env.SITE_URI}` },
};
export const io = require('socket.io')(server, iooptions)
io.on('connection', (s: socketio.Socket) => { })
process.on('unhandledRejection', function (err) {
    writeLog(JSON.stringify({ msg: 'unhandled rejection', err: err }), 'crit');
    process.exit(1);
});
process.on('uncaughtException', function (err) {
    writeLog(JSON.stringify({ msg: 'uncaught exception', err: err }), 'crit');
    process.exit(1);
});
process.on('exit', code => {
    if (code) {
        writeLog(JSON.stringify({ msg: 'process exit', stack: code }), 'crit');
        process.exit(1);
    }
});

import { db } from "./backend/models";
var SequelizeSessionStore = require("connect-session-sequelize")(session.Store);
import { router as apiRoute } from "./backend/routes";
import { CustomTaskScheduler, errLog, Utility, writeLog } from "./backend/utility/index";
export interface user {
    managerId?: number
    customerId?: number
    displayName?: string
    expires: number
}
declare module 'express-session' {
    export interface SessionData {
        user: user;
    }
}

//cors
const corsOptions = {
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'X-Access-Token', 'Authorization'],
    credentials: true,
    methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
    origin: process.env.ENV_TEST ? "http://localhost:3000" : [`https://${process.env.SITE_URI}`,'https://status-check.testweb-demo.com'],
    preflightContinue: false,
};
app.use(cors(corsOptions));
app.use(
    helmet({ contentSecurityPolicy: false }),
    express.json(),
    express.urlencoded({ extended: true }),
    session({
        secret: process.env.SESS_SEC as string,
        store: new SequelizeSessionStore({
            db: db.sequelize,
            checkExpirationInterval: 60 * 60 * 1000
        }),
        name: process.env.SESS_NAME,
        resave: false,
        saveUninitialized: false,
        cookie: {
            sameSite: 'lax',
            maxAge: 86400000 * 7
        }
    }));
// use build folder of react to use as client
app.use(express.static(path.join(__dirname, 'frontend', 'build')));
// router
app.use('/api', apiRoute)
app.use(express.static(path.join(__dirname, 'public')))
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'), function (err: any) {
        if (err) {
            res.status(500).send(err);
        }
    });
});
//PORT
const PORT = process.env.PORT;
app.set('port', PORT)
server.listen(PORT);
let isProduction = process.env.NODE_ENV == "production"
db.sequelize.sync({ alter: !isProduction })
    .then(() => {
        // writeLog(`Server has restarted`, 'restart');
        return CustomTaskScheduler.runMessageNotification()
    }).catch(e => {
        console.warn(e);
        throw e;
    })