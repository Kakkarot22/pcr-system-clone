
import schedule = require("node-schedule");
import { errLog } from ".";
import { NotificationController } from "../controllers/notification.controller";
import { TokenController } from "../controllers/token.controller";

export class CustomTaskScheduler {
    static async runMessageNotification() {
        schedule.scheduleJob("*/5 * * * *", async function () {
            if (process.env.NODE_ENV == "production") {
                await TokenController.destroyExpired()
            }
            if (process.env.MAIL_USER && process.env.MAIL_PW && process.env.MAIL_HOST && process.env.MAIL_PORT) {
                NotificationController.notifyGuestsEmail().then(async () => {
                    //Event 10 minutes
                    NotificationController.notifyGuestsEmail2()
                })
            } else {
                errLog(`${process.env.NODE_ENV} 2 message scheduled task ${(new Date).toString()}`, "api")
            }
        })
    }
}