require("dotenv").config()
import * as path from "path";
import * as bcrypt from "bcryptjs";
import { generate } from "generate-password"
import fs = require("fs");
import * as jwt from "jsonwebtoken";
import { CustomTaskScheduler } from "./scheduler";
import { createTransport, SendMailOptions } from "nodemailer";
import moment = require("moment");
const saltRounds = 10
let nowDate = moment().format('YYYYMM')
class Utility {
    static sign = (data: any) => {
        return jwt.sign(data, process.env.SESS_SEC as string)
    }
    static decode = (data: string) => {
        return jwt.decode(data)
    }
    static createHash = async (data: string): Promise<string> => {
        return await bcrypt.hash(data, saltRounds)
    }
    static comparePassword = async (data: string, hash: string): Promise<boolean> => {
        return await bcrypt.compare(data, hash)
    }
    static generateToken(length: number = 32) {
        return generate({ length: length, numbers: true })
    }
    static uriToJson(uri: string) {
        try {
            let res: any = {}
            uri.split('&').forEach((element: string) => {
                let ele = element.split('=')
                res[ele[0]] = decodeURIComponent(ele[1] || '')
            })
            return JSON.parse(JSON.stringify(res))
        } catch (e: any) {
            return 'エラー1'
        }
    }
    static jsonToUri(json: object): string {
        try {
            let keys = Object.keys(json) as Array<keyof object>
            var query = ""
            keys.forEach(e => {
                query += e + "=" + json[e] + "&"
            });
            return query
        } catch (e: any) {
            return 'エラー2'
        }
    }
    static getDaysBetweenDates(startDate: moment.Moment, endDate: moment.Moment) {
        var now = startDate.clone(), dates = [];

        while (now.isSameOrBefore(endDate)) {
            dates.push(now.format('YYYY-MM-DD'));
            now.add(1, 'day');
        }
        return dates;
    }
    static buildMail(target: string | string[], title: string, link: string): SendMailOptions {
        const replacerNewLine = new RegExp(/\n/, 'gm')
        let brLink = link.replace(replacerNewLine, '<br>')
        return {
            sender: process.env.MAIL_USER,
            from: `興和　PCR・抗原検査予約システム <${process.env.MAIL_USER}>`,
            to: target,
            subject: title,
            text: link,
            html: `<div style="white-space:pre-wrap;">${brLink}</div>`
        }
    }
    static async sendMail(mailOptions: SendMailOptions) {
        let mailTransporter = createTransport({
            host: process.env.MAIL_HOST as string,
            port: parseInt(process.env.MAIL_PORT as string),//587,
            requireTLS: true,
            secure: true, // true for 465, false for other ports
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PW,
            }
        })
        return await mailTransporter.sendMail(mailOptions)
    }
}
class DataConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DataConflictError";
    }
}

function errLog(e: string | number | boolean, mode: 'api' | 'db' | 'fs' | undefined = undefined) {
    if (process.env.CONSOLE_ONLY) {
        console.warn(e, mode)
    } else {
        if (mode == 'api') return fs.appendFile(`logs/api_error${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn)
        else if (mode == 'db') return fs.appendFile(`logs/db_error${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn)
        else if (mode == 'fs') return fs.appendFile(`logs/fs_error${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn)
        else return fs.appendFile(`logs/log_rest${nowDate}.log`, `${e} ${(new Date()).toISOString()} \n`, console.warn)
    }
}
function writeLog(msg: string, logType: string) {
    if (process.env.CONSOLE_ONLY) {
        console.warn(msg, logType)
    } else {
        if (!logType) { return }
        else {
            return fs.appendFile(`logs/${logType}_log${nowDate}.log`, `${msg} ${(new Date()).toISOString()} \n`, err => { if (err) { errLog(err.toString(), "fs") } })
        }
    }
}
export { Utility, writeLog, errLog, CustomTaskScheduler, DataConflictError }
