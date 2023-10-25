"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomTaskScheduler = void 0;
const schedule = require("node-schedule");
const _1 = require(".");
const notification_controller_1 = require("../controllers/notification.controller");
const token_controller_1 = require("../controllers/token.controller");
class CustomTaskScheduler {
    static async runMessageNotification() {
        schedule.scheduleJob("*/5 * * * *", async function () {
            if (process.env.NODE_ENV == "production") {
                await token_controller_1.TokenController.destroyExpired();
            }
            if (process.env.MAIL_USER && process.env.MAIL_PW && process.env.MAIL_HOST && process.env.MAIL_PORT) {
                notification_controller_1.NotificationController.notifyGuestsEmail().then(async () => {
                    notification_controller_1.NotificationController.notifyGuestsEmail2();
                });
            }
            else {
                (0, _1.errLog)(`${process.env.NODE_ENV} 2 message scheduled task ${(new Date).toString()}`, "api");
            }
        });
    }
}
exports.CustomTaskScheduler = CustomTaskScheduler;
