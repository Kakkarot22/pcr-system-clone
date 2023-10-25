import { db } from "../models";
import { Request, Response } from "express";
import { errLog, Utility, writeLog } from "../utility";
import { OccurrenceAttributes } from "../models/occurrence.model";
import { cast, col, fn, Op } from "sequelize";
import { CONFLICT_ERROR, RESPONSE_SUCCESS, SYSTEM_ERROR } from "../config/constants";
import { io } from "../../server";
import moment = require("moment");
export class OccurrenceController {
    static async create(req: Request, res: Response) {
        try {
            res.send(await db.models.occurrences.create(req.body))
        } catch (e: any) {
            errLog(`create occurrence ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async browse(req: Request, res: Response) {
        try {
            //TODO: searchParameters
            res.send(await db.models.occurrences.findAndCountAll())
        } catch (e: any) {
            errLog(`browse occurrences ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async find(req: Request, res: Response) {
        try {
            let occurrenceId = parseInt(req.params.occurrenceId)
            if (!occurrenceId) { throw `invalid occurrence id ${occurrenceId}` }
            res.send(await db.models.occurrences.detailed(occurrenceId))
        } catch (e: any) {
            console.warn(e);
            errLog(`find occurrence ${req.params.occurrenceId}: ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async update(req: Request, res: Response) {
        try {
            let occurrenceId = req.params.occurrenceId
            if (!occurrenceId) { throw `invalid occurrence id ${occurrenceId}` }
            let occurrence = await db.models.occurrences.findByPk(occurrenceId, {
                attributes: {
                    include: [[cast(fn('IFNULL', fn('SUM', col('registrations.expected')), 0), 'signed'), 'sumExpected']],
                },
                include: {
                    association: db.models.occurrences.associations.registrations,
                    attributes: []
                }
            })
            //.then(o => o?.toJSON() as (OccurrenceAttributes & { sumExpected: number }) | null)
            let { maxAttendee, isDisplayed } = req.body
            if (occurrence == null) { throw `occurrence does not exist` }
            if (maxAttendee != null) {
                //@ts-ignore
                if (occurrence.sumExpected > maxAttendee) { throw `occurrence.sumExpected ${occurrence.sumExpected} > maxAttendee ${maxAttendee}` }
                else { occurrence.set({ maxAttendee: maxAttendee }) }
            }
            if (isDisplayed != null) {
                occurrence.set({ isDisplayed: isDisplayed })
            }
            if (occurrence.changed()) {
                await occurrence.save()
                io.emit('updateOccurrence', { occasionId: occurrence.occasionId, occurrenceId: occurrence.occurrenceId })
                writeLog(`update occurrence ${occurrenceId}. params: ${JSON.stringify(req.body)}`, 'occurrence')
                res.sendStatus(RESPONSE_SUCCESS)
            } else {
                res.sendStatus(RESPONSE_SUCCESS)
            }
        } catch (e: any) {
            if (e.msg) {
                errLog(`update occurrence ${req.params.occurrenceId}: ${e.toString()}`, "db")
                res.sendStatus(CONFLICT_ERROR)
            } else {
                errLog(`update occurrence ${req.params.occurrenceId}: ${e.toString()}`, "db")
                res.sendStatus(SYSTEM_ERROR)
            }
        }
    }
    static async editOccurrences(req: Request, res: Response) {
        let occasionId = parseInt(req.body.occasionId)
        try {
            let occurrenceData: { maxAttendee: number, startAt: string, endAt: string, startTime: string | null }[] = req.body.occurrences
            for (const od of occurrenceData) {
                od.startTime = moment(od.startAt).format('HH:mm')
            }
            // errLog(`${JSON.stringify(occurrenceData)}`)
            if (!occasionId || !occurrenceData.length) throw `invalid parameters ${JSON.stringify({ occasionId, occurrences: occurrenceData })}`
            let occurrences = (await db.models.occurrences.findAll({
                attributes: ['occurrenceId', 'startAt', 'startTime', 'endAt', 'deletedAt'],
                where: { occasionId: occasionId, startAt: { [Op.in]: occurrenceData.map(o => o.startAt) } }, paranoid: false
            }))
            let confirmedOccurrences: { maxAttendee: number, occasionId: number, startAt: string | Date, endAt: string, startTime: string, deletedAt: null }[] = []
            let toNotify: OccurrenceAttributes[] = []
            //TODO: update checker to endAt
            occurrenceData.forEach(orb => {
                let orbDate = new Date(orb.startAt).getMinutes()
                let odb = occurrences.find(o => { return 0 == new Date(o.startAt).getMinutes() - orbDate })
                if (odb == null || odb.deletedAt != null) {
                    confirmedOccurrences.push({ maxAttendee: orb.maxAttendee, occasionId: occasionId, startAt: orb.startAt, startTime: orb.startTime!, endAt: orb.endAt, deletedAt: null })
                } else {
                    toNotify.push(odb)
                }
            })
            if (confirmedOccurrences.length > 0) {
                await db.models.occurrences.bulkCreate(confirmedOccurrences, { fields: ['maxAttendee', 'occasionId', 'startAt', 'endAt', 'startTime'], updateOnDuplicate: ['maxAttendee', 'deletedAt'] })
            }
            io.emit('updateOccurrence', { occasionId: occasionId })
            writeLog(`editOccurrences. event ${occasionId}. params: ${JSON.stringify(req.body)}`, 'occurrence')
            if (toNotify.length == 0) {
                res.sendStatus(RESPONSE_SUCCESS)
            } else {
                res.status(RESPONSE_SUCCESS).send({ unchanged: toNotify })
            }
        } catch (e: any) {
            errLog(`update occurrences of occasion ${occasionId}: ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async delete(req: Request, res: Response) {
        let newTransaction = await db.sequelize.transaction()
        let occurrenceId = parseInt(req.params.occurrenceId)
        try {
            if (!occurrenceId) { throw `invalid occurrence id ${occurrenceId}` }
            let occurrence = await db.models.occurrences.findByPk(occurrenceId)
            if (occurrence == null) throw `occurrence does not exist occurrenceId: ${req.params.occurrenceId}`
            let occasionId = occurrence.occasionId
            await occurrence.destroy({ transaction: newTransaction })
            await db.models.registrations.destroy({ where: { occurrenceId: occurrence.occurrenceId }, transaction: newTransaction })
            await newTransaction.commit()
            io.emit('deleteOccurrence', { occasionId: occasionId })
            writeLog(`delete occurrence. event ${occasionId} occurrence ${occurrenceId}`, 'occurrence')
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            await newTransaction.rollback()
            errLog(`delete occurrence ${occurrenceId}: ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
}