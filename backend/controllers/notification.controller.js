"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const sequelize_1 = require("sequelize");
const moment = require("moment");
const utility_1 = require("../utility");
const models_1 = require("../models");
class NotificationController {
    static async notifyGuestEmail(customer, data) {
        try {
            if (!data.message || data.message.length == 0)
                return false;
            const replacerName = new RegExp(/\[NAME\]/, 'gm');
            const replacerDateTime = new RegExp(/\[DATE\]/, 'gm');
            let msg = data.message;
            msg = msg.replace(replacerName, `${customer.lastName} ${customer.firstName}`);
            if (data.time) {
                msg = msg.replace(replacerDateTime, moment(data.time).format('YYYY年MM月DD日 HH時mm分'));
            }
            try {
                let emails = utility_1.Utility.buildMail(customer.email, data.title, msg);
                utility_1.Utility.sendMail(emails);
            }
            catch (e) {
                (0, utility_1.errLog)(`notifyGuestEmail error ${e.toString()}`, "api");
            }
            return;
        }
        catch (e) {
            (0, utility_1.errLog)(`notifyGuestEmail error ${e.toString()}`, "api");
            return;
        }
    }
    static async notifyGuestsEmail() {
        try {
            let from = moment().add(2, 'days').startOf('day');
            let to = moment().add(3, 'days');
            let occasions = await models_1.db.models.occasions.GetOccasionForNotification({ remindMessage: { [sequelize_1.Op.not]: null } }, { startAt: { [sequelize_1.Op.between]: [from.toDate(), to.toDate()] } }, { isNotified: { [sequelize_1.Op.is]: null } }, { email: { [sequelize_1.Op.not]: null } });
            let rIDs = [];
            if (occasions.length == 0) {
                return;
            }
            const replacerName = new RegExp(/\[NAME\]/, 'gm');
            const replacerDateTime = new RegExp(/\[DATE\]/, 'gm');
            occasions.forEach(occa => {
                if (occa.remindMessage == null || occa.remindMessage.length == 0) {
                    return;
                }
                else {
                    occa.occurrences.forEach(o => {
                        o.registrations.forEach(r => {
                            let msg = occa.remindMessage;
                            msg = msg.replace(replacerName, `${r.Customer.lastName} ${r.Customer.firstName}`);
                            msg = msg.replace(replacerDateTime, moment(o.startAt).format('YYYY年MM月DD日 HH時mm分'));
                            try {
                                let email = utility_1.Utility.buildMail(r.Customer.email, occa.type == 'pcr' ? 'PCR検査のご予約リマインダー' : '抗原性検査のご予約リマインダー', msg);
                                utility_1.Utility.sendMail(email);
                                rIDs.push(r.registrationId);
                            }
                            catch (err) {
                                (0, utility_1.errLog)(`notifyGuests multicast error ${err.toString()}`, "api");
                            }
                        });
                    });
                }
            });
            if (rIDs.length == 0) {
                return;
            }
            await models_1.db.models.registrations.update({ isNotified: from.toDate() }, {
                fields: ['isNotified'],
                where: { isNotified: null, registrationId: { [sequelize_1.Op.in]: rIDs } }
            });
            return true;
        }
        catch (e) {
            (0, utility_1.errLog)(`notify guests error ${e.toString()}`, "api");
            return false;
        }
    }
    static async notifyGuestsEmail2() {
        try {
            let from = moment();
            let to = moment().add(1, 'day');
            let notifiedAt = moment();
            let occasions = await models_1.db.models.occasions.GetOccasionForNotification({ remindMessage1: { [sequelize_1.Op.not]: null } }, { startAt: { [sequelize_1.Op.between]: [from.toDate(), to.toDate()] } }, { isNotified1: { [sequelize_1.Op.is]: null } }, { email: { [sequelize_1.Op.not]: null } });
            let rIDs = [];
            if (occasions.length == 0) {
                return;
            }
            const replacerName = new RegExp(/\[NAME\]/, 'gm');
            const replacerDateTime = new RegExp(/\[DATE\]/, 'gm');
            occasions.forEach(occa => {
                if (occa.remindMessage1 == null || occa.remindMessage1.length == 0) {
                    return;
                }
                else {
                    occa.occurrences.forEach(o => {
                        o.registrations.forEach(r => {
                            let msg = occa.remindMessage1;
                            msg = msg.replace(replacerName, `${r.Customer.lastName} ${r.Customer.firstName}`);
                            msg = msg.replace(replacerDateTime, moment(o.startAt).format('YYYY年MM月DD日 HH時mm分'));
                            try {
                                let email = utility_1.Utility.buildMail(r.Customer.email, occa.type == 'pcr' ? 'PCR検査のご予約リマインダー' : '抗原性検査のご予約リマインダー', msg);
                                utility_1.Utility.sendMail(email);
                                rIDs.push(r.registrationId);
                            }
                            catch (err) {
                                (0, utility_1.errLog)(`notifyGuests2 multicast error ${err.toString()}`, "api");
                            }
                        });
                    });
                }
            });
            if (rIDs.length == 0) {
                return;
            }
            await models_1.db.models.registrations.update({ isNotified1: notifiedAt.toDate() }, {
                fields: ['isNotified1'],
                where: { isNotified1: null, registrationId: { [sequelize_1.Op.in]: rIDs } }
            });
            return true;
        }
        catch (e) {
            (0, utility_1.errLog)(`notify guests2 error ${e.toString()}`, "api");
            return false;
        }
    }
}
exports.NotificationController = NotificationController;
