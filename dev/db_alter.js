"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDB = void 0;
require("dotenv").config();
const fs = require("fs");
const bcrypt = require("bcryptjs");
const models_1 = require("../backend/models");
const console_1 = require("console");
const moment = require("moment");
const isDBAlter = process.argv.find((argc) => argc == "-dbAlter");
const isDBForce = process.argv.find((argc) => argc == "-dbForce");
const isDBSeed = process.argv.find((argc) => argc == "-dbSeed");
let dbInitConfig = {
    alter: false,
    force: false,
};
if (isDBForce) {
    dbInitConfig.force = true;
}
else if (isDBAlter) {
    dbInitConfig.alter = true;
}
models_1.db.sequelize
    .sync(dbInitConfig)
    .then(async () => {
    return seedDB(models_1.db);
})
    .then(() => {
    (0, console_1.log)("db finished");
    process.exit(0);
})
    .catch((e) => {
    console.warn(e);
    fs.appendFile("../logs/log_rest.log", `db init error ${e.toString()}, ${JSON.stringify(e)}. ${new Date().toISOString()} \n`, console.warn);
    process.exit(1);
});
async function seedDB(db) {
    if (!(process.env.INIT_MANAGER_USERNAME &&
        process.env.INIT_MANAGER_PW &&
        process.env.INIT_MANAGER_EMAIL)) {
        throw new Error("initialManager credential is not set");
    }
    if (isDBSeed) {
        if ((await db.models.managers.findOne()) == null) {
            await db.models.managers.create({
                username: process.env.INIT_MANAGER_USERNAME,
                pwhash: await bcrypt.hash(process.env.INIT_MANAGER_PW, 10),
                recoveryMail: process.env.INIT_MANAGER_EMAIL,
                isActivated: true,
            });
        }
        await db.models.customers.create({
            firstName: "名前",
            lastName: "苗字",
            firstNameKana: "なまえ",
            lastNameKana: "みょうじ",
            email: "test@line-sys.com",
            telephone: "01234567890",
            zipPostal: "4600003",
            prefecture: "愛知県",
            city: "名古屋市",
            address: "錦2-12-34",
            pwhash: await bcrypt.hash("test", 10),
        });
        let occasionPCR = await db.models.occasions.create({
            type: "pcr",
            title: "PCR TEST",
            telephone: "12365478900",
            address: "名古屋駅",
            zipPostal: "4600003",
            timeCancel: 1,
            textCancel: "text Cancel test",
            canCancel: false,
            cancelMessage: `[NAME]様\n[DATE]にご予約キャンセルされました。\nご利用ありがとうございます。改めてご予約の場合は下記のリンクをを押してください。\n　https://${process.env.SITE_URI}`,
            regMessage: `[NAME]様\nご利用ありがとうございます。\nご予約完了になりました。\n検査の当日[DATE]QRコードをスタッフに見せてください。\n　https://${process.env.SITE_URI}`,
            remindMessage: `[NAME]様\nPCR検査のリマインダーです。\nご予約は[DATE]です。\n　https://${process.env.SITE_URI}`,
            remindMessage1: `[NAME]様\n予約システムご利用、誠にありがとうございます。\nPCR検査のリマインダーです。\nももなく[DATE]に検査が行いますQRコードをスタッフに見せてください。\n　https://${process.env.SITE_URI}`,
            limitTime: true,
            limitDays: 1,
            limitHours: 18,
            limitMinutes: 0,
        });
        let fakeOccurrences = [];
        let startDateTime = moment("2023-    09:00:00");
        for (let i = 0; i < 20; i++) {
            startDateTime.hour(9).minute(0);
            for (let j = 0; j < 8; j++) {
                fakeOccurrences.push({
                    occasionId: occasionPCR.occasionId,
                    maxAttendee: Math.floor(Math.random() * (30 - 20) + 20),
                    startAt: moment(startDateTime).format("YYYY-MM-DD HH:mm:ss"),
                    endAt: moment(startDateTime)
                        .add(59, "minutes")
                        .format("YYYY-MM-DD HH:mm:ss"),
                    startTime: startDateTime.format("HH:mm:ss"),
                });
                startDateTime.add(1, "hour");
            }
            startDateTime.add(1, "day");
        }
        await db.models.occurrences.bulkCreate(fakeOccurrences, {
            fields: ["occasionId", "maxAttendee", "startAt", "endAt", "startTime"],
        });
        let occasionAntigen = await db.models.occasions.create({
            type: "antigen",
            title: "ANTIGEN TEST",
            telephone: "12365478900",
            address: "名古屋駅",
            zipPostal: "4600003",
            timeCancel: 1,
            textCancel: "text Cancel test",
            canCancel: false,
            cancelMessage: `[NAME]様\n[DATE]にご予約キャンセルされました。\nご利用ありがとうございます。改めてご予約の場合は下記のリンクをを押してください。\n　https://${process.env.SITE_URI}`,
            regMessage: `[NAME]様\nご利用ありがとうございます。\n予約完了になりました。\n検査の当日[DATE]QRコードをスタッフに見せてください。\n　https://${process.env.SITE_URI}`,
            remindMessage: `[NAME]様\nPCR検査のリマインダーです。\nご予約は[DATE]です。\n　https://${process.env.SITE_URI}`,
            remindMessage1: `[NAME]様\n予約システムご利用、誠にありがとうございます。\nPCR検査のリマインダーです。\nももなく[DATE]に検査が行いますQRコードをスタッフに見せてください。\n　https://${process.env.SITE_URI}`,
            limitTime: true,
            limitDays: 1,
            limitHours: 18,
            limitMinutes: 0,
        });
        let fakeOccurrences1 = [];
        let startDateTime1 = moment("2023-11-10 09:00:00");
        for (let i = 0; i < 20; i++) {
            startDateTime1.hour(9).minute(0);
            for (let j = 0; j < 8; j++) {
                fakeOccurrences1.push({
                    occasionId: occasionAntigen.occasionId,
                    maxAttendee: Math.floor(Math.random() * (30 - 20) + 20),
                    startAt: moment(startDateTime1).format("YYYY-MM-DD HH:mm:ss"),
                    endAt: moment(startDateTime1)
                        .add(59, "minutes")
                        .format("YYYY-MM-DD HH:mm:ss"),
                    startTime: startDateTime1.format("HH:mm:ss"),
                });
                startDateTime1.add(1, "hour");
            }
            startDateTime1.add(1, "day");
        }
        await db.models.occurrences.bulkCreate(fakeOccurrences1, {
            fields: ["occasionId", "maxAttendee", "startAt", "endAt", "startTime"],
        });
    }
}
exports.seedDB = seedDB;
process.on("uncaughtException", function (err) {
    if (err) {
        if (process.env.ENV_TEST) {
            console.warn(err);
        }
        else {
            fs.appendFile("../logs/log_rest.log", `uncaught exception. stack: ${err.stack} ${new Date().toISOString()} \n`, console.warn);
        }
        process.exit(1);
    }
});
process.on("exit", (code) => {
    if (code) {
        if (process.env.ENV_TEST) {
            console.warn(code);
        }
        else {
            fs.appendFile("../logs/log_rest.log", `uncaught exception. stack: ${code} ${new Date().toISOString()} \n`, console.warn);
        }
        process.exit(1);
    }
});
