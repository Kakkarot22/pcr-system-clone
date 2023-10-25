import { db } from "../models";
import { Request, Response } from "express";
import { errLog, Utility, writeLog } from "../utility";
import { CustomerAttributes } from "../models/customer.model";
import { cast, col, fn, literal, Op } from "sequelize";
import { CONFLICT_ERROR, RESPONSE_SUCCESS, SYSTEM_ERROR } from "../config/constants";
import { io } from "../../server";
import { NotificationController } from "./notification.controller";
export class MasterController {
    static async createManager(req: Request, res: Response) {
        try {
            await db.models.managers.createManager(req.body)
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async createCustomerRegistration(req: Request, res: Response) {
        try {
            let { firstName, lastName, telephone, occurrenceId } = req.body
            if (!occurrenceId || isNaN(occurrenceId)) { throw `invalid parameterse ${JSON.stringify(req.body)}` }
            let occurrence = await db.models.occurrences.findByPk(occurrenceId, { attributes: ['occasionId', 'occurrenceId'] })
            if (occurrence == null) { throw `occurrence ${occurrenceId} doesn not exist` }
            let customer = await db.models.customers.create({
                firstName: firstName, lastName: lastName, telephone: telephone, isManual: true,
                //@ts-ignore
                registrations: [{ occurrenceId: occurrenceId, expected: 1, isNotified: new Date, isNotified1: new Date }]
            }, { include: { association: db.models.customers.associations.registrations } })
            io.emit('newRegistration', { occasionId: occurrence.occasionId, occurrenceId: occurrence.occurrenceId })
            writeLog(`createCustomerRegistration. customer: ${customer.customerId}. occurrenceId: ${occurrenceId}. ${firstName}, ${lastName}, ${telephone}}`, "customer")
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`new registration from admin ${e.toString()} params: ${JSON.stringify(req.body)}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async updateCustomerRegistration(req: Request, res: Response) {
        try {
            let { registrationId, attended, firstName, lastName, telephone, consent1, consent2 } = req.body
            if (!registrationId) throw `invalid parameters ${JSON.stringify(req.body)}`
            // if (attended == null && (!consent1 || !consent2)) throw 'invalid consent'
            let registration = await db.models.registrations.findByPk(registrationId, {
                include: [{
                    association: db.models.registrations.associations.Customer,
                    attributes: ['customerId', 'isManual'],
                    required: true
                }, {
                    association: db.models.registrations.associations.Occurrence,
                    attributes: ['occurrenceId', 'maxAttendee', 'startAt', 'endAt'],
                    required: true,
                    include: [{
                        association: db.models.occurrences.associations.Occasion,
                        attributes: ['occasionId'],
                        required: true
                    }]
                }
                ]
            })
            if (registration == null) throw `registration not found ${registrationId}`
            if (!isNaN(attended) && [0, 1].includes(attended)) {
                registration.set('attended', attended)
            }
            let customer = registration.Customer!
            if (firstName !== undefined) { customer.set({ firstName: firstName }) }
            if (lastName !== undefined) { customer.set({ lastName: lastName }) }
            if (telephone !== undefined) { customer.set({ telephone: telephone }) }
            if (consent1 !== undefined) { customer.set({ consent1: consent1 }) }
            if (consent2 !== undefined) { customer.set({ consent2: consent2 }) }
            if (customer.changed()) {
                await customer.save()
            }
            if (registration.changed()) {
                io.emit('confirmRegistration', { occasionId: registration.Occurrence!.Occasion!.occasionId, occurrenceId: registration.Occurrence!.occurrenceId })
                await registration.save()
            }
            writeLog(`updateCustomerRegistration. customer: ${customer.customerId}. registration: ${registrationId}.`, "customer")
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`update registration from admin ${e.toString()} params: ${JSON.stringify(req.body)}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async cancelCustomerRegistration(req: Request, res: Response) {
        try {
            let registrationId = req.body.registrationId
            let registration = await db.models.registrations.findByPk(registrationId, {
                include: [{
                    association: db.models.registrations.associations.Occurrence,
                    attributes: ['occurrenceId', 'occasionId'],
                    required: true,
                    include: [{
                        association: db.models.occurrences.associations.Occasion,
                        attributes: ['cancelMessage', 'type']
                    }]
                }, {
                    association: db.models.registrations.associations.Customer,
                    attributes: ['customerId', 'firstName', 'lastName', 'email']
                }]
            })
            if (registration == null) throw `registration not found ${registrationId}`
            let occaId = registration.Occurrence!.occasionId
            let occuId = registration.Occurrence!.occurrenceId
            if (req.body.isLate == true) {
                await registration.destroy()
            } else {
                registration.set('cancelledAt', new Date())
                await registration.save().then(r => r.destroy())
            }
            io.emit('cancelRegistration', { occasionId: occaId, occurrenceId: occuId })
            if (registration.Occurrence!.Occasion!.cancelMessage) {
                await NotificationController.notifyGuestEmail(
                    { lastName: registration.Customer!.lastName!, firstName: registration.Customer!.firstName!, email: registration.Customer!.email! },
                    { title: registration.Occurrence!.Occasion!.type == 'pcr' ? 'PCR検査のご予約キャンセル' : '抗原性検査のご予約キャンセル', time: new Date(), message: registration.Occurrence!.Occasion!.cancelMessage })
            }
            writeLog(`cancelCustomerRegistration. registration: ${registrationId}. event: ${occaId}. occurrence: ${occuId}. cancel?: ${req.body.isLate == true}`, "registration")
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`cancel registration from admin ${e.toString()} params:${JSON.stringify(req.body)}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async getCustomerRegistration(req: Request, res: Response) {
        try {
            let registrationId = req.body.registrationId
            if (!registrationId) throw `invalid parameters ${JSON.stringify(req.body)}`
            let registration = await db.models.registrations.findOne({
                where: { registrationId: registrationId },
                attributes: [
                    'registrationId', 'customerId', 'expected', 'attended',
                    [col('Occurrence.startAt'), 'startAt'],
                    [col('Occurrence.endAt'), 'endAt'],
                    [col('Occurrence.Occasion.title'), 'title'],
                    [col('Occurrence.Occasion.type'), 'type'],
                    [col('Occurrence.Occasion.address'), 'address'],
                    [col('Occurrence.Occasion.zipPostal'), 'zipPostal'],
                    [col('Customer.firstName'), 'firstName'],
                    [col('Customer.lastName'), 'lastName'],
                    [col('Customer.telephone'), 'telephone'],
                    [col('Customer.firstNameKana'), 'firstNameKana'],
                    [col('Customer.lastNameKana'), 'lastNameKana'],
                    [col('Customer.email'), 'email'],
                    [col('Customer.zipPostal'), 'zipPostal'],
                    [col('Customer.prefecture'), 'prefecture'],
                    [col('Customer.city'), 'city'],
                    [col('Customer.address'), 'address'],
                    [col('Customer.gender'), 'gender'],
                    [col('Customer.dateOfBirth'), 'dateOfBirth'],
                    [col('Customer.q2inspectionCount'), 'q2inspectionCount'],
                    [col('Customer.q3inspectionPurpose'), 'q3inspectionPurpose'],
                    [col('Customer.q4isVaccinated'), 'q4isVaccinated'],
                    [col('Customer.q5unvaccinatedReason'), 'q5unvaccinatedReason']
                ],
                include: [{
                    association: db.models.registrations.associations.Occurrence,
                    attributes: [],
                    include: [{
                        association: db.models.occurrences.associations.Occasion,
                        attributes: []
                    }]
                },
                {
                    association: db.models.registrations.associations.Customer,
                    attributes: []
                }]
            })
            if (registration == null) { throw `${registrationId} does not exist` }
            else if (registration.cancelledAt != null) { res.sendStatus(CONFLICT_ERROR) }
            else { res.send(registration) }
        } catch (e: any) {
            errLog(`get registration ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async confirmRegistration(req: Request, res: Response) {
        try {
            let { registrationId } = req.body
            if (registrationId == null) throw `invalid parameters ${JSON.stringify(req.body)}`
            let registration = await db.models.registrations.findOne({
                where: { registrationId: registrationId },
                attributes: ['registrationId', 'attended', 'occurrenceId'],
                include: [{
                    association: db.models.registrations.associations.Occurrence,
                    attributes: ['occasionId']
                }]
            })
            let occasionId = null
            let occurrenceId = null
            if (registration == null) throw `registration does not exist ${req.body.registrationId}`
            if (registration.attended != 0) throw `registration ${registrationId} already registered ${registration.attended}`
            else {
                occasionId = registration.Occurrence!.occasionId
                occurrenceId = registration.occurrenceId
                await registration.update({ attended: 1 })
            }
            io.emit('confirmRegistration', { occasionId: occasionId, occurrenceId: occurrenceId })
            writeLog(`cancelCustomerRegistration. registration: ${registrationId}. event: ${registration.Occurrence!.occasionId}. occurrence: ${registration.occurrenceId}`, "registration")
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`confirm registration ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
}