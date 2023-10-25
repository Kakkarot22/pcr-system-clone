import { Op } from "sequelize";
import moment = require("moment");
import { errLog, Utility } from "../utility";
import { db } from "../models";
export class NotificationController {
    static async notifyGuestEmail(customer: { lastName: string, firstName: string, email: string }, data: { title: string, time: Date, message?: string | null }) {
        try {
            if (!data.message || data.message.length == 0) return false
            const replacerName = new RegExp(/\[NAME\]/, 'gm')
            const replacerDateTime = new RegExp(/\[DATE\]/, 'gm')
            let msg = data.message
            msg = msg.replace(replacerName, `${customer!.lastName} ${customer!.firstName}`)
            if (data.time) {
                msg = msg.replace(replacerDateTime, moment(data.time).format('YYYY年MM月DD日 HH時mm分'))
            }
            try {
                let emails = Utility.buildMail(customer.email, data.title, msg)
                Utility.sendMail(emails)
            } catch (e: any) {
                errLog(`notifyGuestEmail error ${e.toString()}`, "api")
            }
            return
        } catch (e: any) {
            errLog(`notifyGuestEmail error ${e.toString()}`, "api")
            return
        }
    }
    static async notifyGuestsEmail() {
        try {
            let from = moment().add(2, 'days').startOf('day')
            let to = moment().add(3, 'days')
            // let from = new Date()
            // let to = new Date()
            // to.setDate(to.getDate() + 3)
            let occasions = await db.models.occasions.GetOccasionForNotification(
                { remindMessage: { [Op.not]: null } },
                { startAt: { [Op.between]: [from.toDate(), to.toDate()] } },
                { isNotified: { [Op.is]: null } },
                { email: { [Op.not]: null } }
            )
            let rIDs: number[] = []
            if (occasions.length == 0) { return }
            const replacerName = new RegExp(/\[NAME\]/, 'gm')
            const replacerDateTime = new RegExp(/\[DATE\]/, 'gm')
            occasions.forEach(occa => {
                if (occa.remindMessage == null || occa.remindMessage.length == 0) { return }
                else {
                    occa.occurrences!.forEach(o => {
                        o.registrations!.forEach(r => {
                            let msg = occa.remindMessage!
                            msg = msg.replace(replacerName, `${r.Customer!.lastName} ${r.Customer!.firstName}`)
                            msg = msg.replace(replacerDateTime, moment(o.startAt).format('YYYY年MM月DD日 HH時mm分'))
                            try {
                                let email = Utility.buildMail(r.Customer!.email!, occa.type == 'pcr' ? 'PCR検査のご予約リマインダー' : '抗原性検査のご予約リマインダー', msg)
                                Utility.sendMail(email)
                                rIDs.push(r.registrationId)
                            } catch (err: any) {
                                errLog(`notifyGuests multicast error ${err.toString()}`, "api")
                            }
                        })
                    });
                }
            })
            if (rIDs.length == 0) { return }
            await db.models.registrations.update({ isNotified: from.toDate() }, {
                fields: ['isNotified'],
                where: { isNotified: null, registrationId: { [Op.in]: rIDs } }
            })
            return true
        } catch (e: any) {
            errLog(`notify guests error ${e.toString()}`, "api")
            return false
        }
    }
    static async notifyGuestsEmail2() {
        try {
            let from = moment()
            let to = moment().add(1, 'day')
            let notifiedAt = moment()
            // let from = new Date()
            // let to = new Date()
            // from.setMinutes(from.getMinutes() - 1)
            // to.setMinutes(to.getMinutes() + 11)
            let occasions = await db.models.occasions.GetOccasionForNotification(
                { remindMessage1: { [Op.not]: null } },
                { startAt: { [Op.between]: [from.toDate(), to.toDate()] } },
                { isNotified1: { [Op.is]: null } },
                { email: { [Op.not]: null } }
            )
            let rIDs: number[] = []
            if (occasions.length == 0) { return }
            const replacerName = new RegExp(/\[NAME\]/, 'gm')
            const replacerDateTime = new RegExp(/\[DATE\]/, 'gm')
            occasions.forEach(occa => {
                if (occa.remindMessage1 == null || occa.remindMessage1.length == 0) { return }
                else {
                    occa.occurrences!.forEach(o => {
                        o.registrations!.forEach(r => {
                            let msg = occa.remindMessage1!
                            msg = msg.replace(replacerName, `${r.Customer!.lastName} ${r.Customer!.firstName}`)
                            msg = msg.replace(replacerDateTime, moment(o.startAt).format('YYYY年MM月DD日 HH時mm分'))
                            try {
                                let email = Utility.buildMail(r.Customer!.email!, occa.type == 'pcr' ? 'PCR検査のご予約リマインダー' : '抗原性検査のご予約リマインダー', msg)
                                // let email = Utility.buildMail(r.Customer!.email!, 'ご予約リマインダー', msg)
                                Utility.sendMail(email)
                                rIDs.push(r.registrationId)
                            } catch (err: any) {
                                errLog(`notifyGuests2 multicast error ${err.toString()}`, "api")
                            }
                        })
                    });
                }
            })
            if (rIDs.length == 0) { return }
            await db.models.registrations.update({ isNotified1: notifiedAt.toDate() }, {
                fields: ['isNotified1'],
                where: { isNotified1: null, registrationId: { [Op.in]: rIDs } }
            })
            return true
        } catch (e: any) {
            errLog(`notify guests2 error ${e.toString()}`, "api")
            return false
        }
    }
}