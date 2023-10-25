"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataConflictError = exports.CustomTaskScheduler = exports.errLog = exports.writeLog = exports.Utility = void 0;
require("dotenv").config();
const bcrypt = require("bcryptjs");
const generate_password_1 = require("generate-password");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const scheduler_1 = require("./scheduler");
Object.defineProperty(exports, "CustomTaskScheduler", { enumerable: true, get: function () { return scheduler_1.CustomTaskScheduler; } });
const nodemailer_1 = require("nodemailer");
const moment = require("moment");
const saltRounds = 10;
let nowDate = moment().format('YYYYMM');
class Utility {
    static generateToken(length = 32) {
        return (0, generate_password_1.generate)({ length: length, numbers: true });
    }
    static uriToJson(uri) {
        try {
            let res = {};
            uri.split('&').forEach((element) => {
                let ele = element.split('=');
                res[ele[0]] = decodeURIComponent(ele[1] || '');
            });
            return JSON.parse(JSON.stringify(res));
        }
        catch (e) {
            return 'エラー1';
        }
    }
    static jsonToUri(json) {
        try {
            let keys = Object.keys(json);
            var query = "";
            keys.forEach(e => {
                query += e + "=" + json[e] + "&";
            });
            return query;
        }
        catch (e) {
            return 'エラー2';
        }
    }
    static getDaysBetweenDates(startDate, endDate) {
        var now = startDate.clone(), dates = [];
        while (now.isSameOrBefore(endDate)) {
            dates.push(now.format('YYYY-MM-DD'));
            now.add(1, 'day');
        }
        return dates;
    }
    static buildMail(target, title, link) {
        const replacerNewLine = new RegExp(/\n/, 'gm');
        let brLink = link.replace(replacerNewLine, '<br>');
        return {
            sender: process.env.MAIL_USER,
            from: `興和　PCR・抗原検査予約システム <${process.env.MAIL_USER}>`,
            to: target,
            subject: title,
            text: link,
            html: `<div style="white-space:pre-wrap;">${brLink}</div>`
        };
    }
    static async sendMail(mailOptions) {
        let mailTransporter = (0, nodemailer_1.createTransport)({
            host: process.env.MAIL_HOST,
            port: parseInt(process.env.MAIL_PORT),
            requireTLS: true,
            secure: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PW,
            }
        });
        return await mailTransporter.sendMail(mailOptions);
    }
}
exports.Utility = Utility;
_a = Utility;
Utility.sign = (data) => {
    return jwt.sign(data, process.env.SESS_SEC);
};
Utility.decode = (data) => {
    return jwt.decode(data);
};
Utility.createHash = async (data) => {
    return await bcrypt.hash(data, saltRounds);
};
Utility.comparePassword = async (data, hash) => {
    return await bcrypt.compare(data, hash);
};
class DataConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = "DataConflictError";
    }
}
exports.DataConflictError = DataConflictError;
function errLog(e, mode = undefined) {
    if (process.env.CONSOLE_ONLY) {
        console.warn(e, mode);
    }
    else {
        if (mode == 'api')
            return fs.appendFile(`logs/api_error${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn);
        else if (mode == 'db')
            return fs.appendFile(`logs/db_error${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn);
        else if (mode == 'fs')
            return fs.appendFile(`logs/fs_error${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn);
        else
            return fs.appendFile(`logs/log_rest${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn);
    }
}
exports.errLog = errLog;
function writeLog(msg, logType) {
    if (process.env.CONSOLE_ONLY) {
        console.warn(msg, logType);
    }
    else {
        if (!logType) {
            return;
        }
        else {
            return fs.appendFile(`logs/${logType}_log${nowDate}.log`, `${msg} ${(new Date()).toISOString()} \n`, err => { if (err) {
                errLog(err.toString(), "fs");
            } });
        }
    }
}
exports.writeLog = writeLog;
