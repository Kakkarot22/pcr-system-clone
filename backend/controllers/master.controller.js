"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasterController = void 0;
const models_1 = require("../models");
const utility_1 = require("../utility");
const sequelize_1 = require("sequelize");
const constants_1 = require("../config/constants");
const server_1 = require("../../server");
const notification_controller_1 = require("./notification.controller");
class MasterController {
    static async createManager(req, res) {
        try {
            await models_1.db.models.managers.createManager(req.body);
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async createCustomerRegistration(req, res) {
        try {
            let { firstName, lastName, telephone, occurrenceId } = req.body;
            if (!occurrenceId || isNaN(occurrenceId)) {
                throw `invalid parameterse ${JSON.stringify(req.body)}`;
            }
            let occurrence = await models_1.db.models.occurrences.findByPk(occurrenceId, { attributes: ['occasionId', 'occurrenceId'] });
            if (occurrence == null) {
                throw `occurrence ${occurrenceId} doesn not exist`;
            }
            let customer = await models_1.db.models.customers.create({
                firstName: firstName, lastName: lastName, telephone: telephone, isManual: true,
                registrations: [{ occurrenceId: occurrenceId, expected: 1, isNotified: new Date, isNotified1: new Date }]
            }, { include: { association: models_1.db.models.customers.associations.registrations } });
            server_1.io.emit('newRegistration', { occasionId: occurrence.occasionId, occurrenceId: occurrence.occurrenceId });
            (0, utility_1.writeLog)(`createCustomerRegistration. customer: ${customer.customerId}. occurrenceId: ${occurrenceId}. ${firstName}, ${lastName}, ${telephone}}`, "customer");
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`new registration from admin ${e.toString()} params: ${JSON.stringify(req.body)}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async updateCustomerRegistration(req, res) {
        try {
            let { registrationId, attended, firstName, lastName, telephone, consent1, consent2 } = req.body;
            if (!registrationId)
                throw `invalid parameters ${JSON.stringify(req.body)}`;
            let registration = await models_1.db.models.registrations.findByPk(registrationId, {
                include: [{
                        association: models_1.db.models.registrations.associations.Customer,
                        attributes: ['customerId', 'isManual'],
                        required: true
                    }, {
                        association: models_1.db.models.registrations.associations.Occurrence,
                        attributes: ['occurrenceId', 'maxAttendee', 'startAt', 'endAt'],
                        required: true,
                        include: [{
                                association: models_1.db.models.occurrences.associations.Occasion,
                                attributes: ['occasionId'],
                                required: true
                            }]
                    }
                ]
            });
            if (registration == null)
                throw `registration not found ${registrationId}`;
            if (!isNaN(attended) && [0, 1].includes(attended)) {
                registration.set('attended', attended);
            }
            let customer = registration.Customer;
            if (firstName !== undefined) {
                customer.set({ firstName: firstName });
            }
            if (lastName !== undefined) {
                customer.set({ lastName: lastName });
            }
            if (telephone !== undefined) {
                customer.set({ telephone: telephone });
            }
            if (consent1 !== undefined) {
                customer.set({ consent1: consent1 });
            }
            if (consent2 !== undefined) {
                customer.set({ consent2: consent2 });
            }
            if (customer.changed()) {
                await customer.save();
            }
            if (registration.changed()) {
                server_1.io.emit('confirmRegistration', { occasionId: registration.Occurrence.Occasion.occasionId, occurrenceId: registration.Occurrence.occurrenceId });
                await registration.save();
            }
            (0, utility_1.writeLog)(`updateCustomerRegistration. customer: ${customer.customerId}. registration: ${registrationId}.`, "customer");
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`update registration from admin ${e.toString()} params: ${JSON.stringify(req.body)}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async cancelCustomerRegistration(req, res) {
        try {
            let registrationId = req.body.registrationId;
            let registration = await models_1.db.models.registrations.findByPk(registrationId, {
                include: [{
                        association: models_1.db.models.registrations.associations.Occurrence,
                        attributes: ['occurrenceId', 'occasionId'],
                        required: true,
                        include: [{
                                association: models_1.db.models.occurrences.associations.Occasion,
                                attributes: ['cancelMessage', 'type']
                            }]
                    }, {
                        association: models_1.db.models.registrations.associations.Customer,
                        attributes: ['customerId', 'firstName', 'lastName', 'email']
                    }]
            });
            if (registration == null)
                throw `registration not found ${registrationId}`;
            let occaId = registration.Occurrence.occasionId;
            let occuId = registration.Occurrence.occurrenceId;
            if (req.body.isLate == true) {
                await registration.destroy();
            }
            else {
                registration.set('cancelledAt', new Date());
                await registration.save().then(r => r.destroy());
            }
            server_1.io.emit('cancelRegistration', { occasionId: occaId, occurrenceId: occuId });
            if (registration.Occurrence.Occasion.cancelMessage) {
                await notification_controller_1.NotificationController.notifyGuestEmail({ lastName: registration.Customer.lastName, firstName: registration.Customer.firstName, email: registration.Customer.email }, { title: registration.Occurrence.Occasion.type == 'pcr' ? 'PCR検査のご予約キャンセル' : '抗原性検査のご予約キャンセル', time: new Date(), message: registration.Occurrence.Occasion.cancelMessage });
            }
            (0, utility_1.writeLog)(`cancelCustomerRegistration. registration: ${registrationId}. event: ${occaId}. occurrence: ${occuId}. cancel?: ${req.body.isLate == true}`, "registration");
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`cancel registration from admin ${e.toString()} params:${JSON.stringify(req.body)}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getCustomerRegistration(req, res) {
        try {
            let registrationId = req.body.registrationId;
            if (!registrationId)
                throw `invalid parameters ${JSON.stringify(req.body)}`;
            let registration = await models_1.db.models.registrations.findOne({
                where: { registrationId: registrationId },
                attributes: [
                    'registrationId', 'customerId', 'expected', 'attended',
                    [(0, sequelize_1.col)('Occurrence.startAt'), 'startAt'],
                    [(0, sequelize_1.col)('Occurrence.endAt'), 'endAt'],
                    [(0, sequelize_1.col)('Occurrence.Occasion.title'), 'title'],
                    [(0, sequelize_1.col)('Occurrence.Occasion.type'), 'type'],
                    [(0, sequelize_1.col)('Occurrence.Occasion.address'), 'address'],
                    [(0, sequelize_1.col)('Occurrence.Occasion.zipPostal'), 'zipPostal'],
                    [(0, sequelize_1.col)('Customer.firstName'), 'firstName'],
                    [(0, sequelize_1.col)('Customer.lastName'), 'lastName'],
                    [(0, sequelize_1.col)('Customer.telephone'), 'telephone'],
                    [(0, sequelize_1.col)('Customer.firstNameKana'), 'firstNameKana'],
                    [(0, sequelize_1.col)('Customer.lastNameKana'), 'lastNameKana'],
                    [(0, sequelize_1.col)('Customer.email'), 'email'],
                    [(0, sequelize_1.col)('Customer.zipPostal'), 'zipPostal'],
                    [(0, sequelize_1.col)('Customer.prefecture'), 'prefecture'],
                    [(0, sequelize_1.col)('Customer.city'), 'city'],
                    [(0, sequelize_1.col)('Customer.address'), 'address'],
                    [(0, sequelize_1.col)('Customer.gender'), 'gender'],
                    [(0, sequelize_1.col)('Customer.dateOfBirth'), 'dateOfBirth'],
                    [(0, sequelize_1.col)('Customer.q2inspectionCount'), 'q2inspectionCount'],
                    [(0, sequelize_1.col)('Customer.q3inspectionPurpose'), 'q3inspectionPurpose'],
                    [(0, sequelize_1.col)('Customer.q4isVaccinated'), 'q4isVaccinated'],
                    [(0, sequelize_1.col)('Customer.q5unvaccinatedReason'), 'q5unvaccinatedReason']
                ],
                include: [{
                        association: models_1.db.models.registrations.associations.Occurrence,
                        attributes: [],
                        include: [{
                                association: models_1.db.models.occurrences.associations.Occasion,
                                attributes: []
                            }]
                    },
                    {
                        association: models_1.db.models.registrations.associations.Customer,
                        attributes: []
                    }]
            });
            if (registration == null) {
                throw `${registrationId} does not exist`;
            }
            else if (registration.cancelledAt != null) {
                res.sendStatus(constants_1.CONFLICT_ERROR);
            }
            else {
                res.send(registration);
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`get registration ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async confirmRegistration(req, res) {
        try {
            let { registrationId } = req.body;
            if (registrationId == null)
                throw `invalid parameters ${JSON.stringify(req.body)}`;
            let registration = await models_1.db.models.registrations.findOne({
                where: { registrationId: registrationId },
                attributes: ['registrationId', 'attended', 'occurrenceId'],
                include: [{
                        association: models_1.db.models.registrations.associations.Occurrence,
                        attributes: ['occasionId']
                    }]
            });
            let occasionId = null;
            let occurrenceId = null;
            if (registration == null)
                throw `registration does not exist ${req.body.registrationId}`;
            if (registration.attended != 0)
                throw `registration ${registrationId} already registered ${registration.attended}`;
            else {
                occasionId = registration.Occurrence.occasionId;
                occurrenceId = registration.occurrenceId;
                await registration.update({ attended: 1 });
            }
            server_1.io.emit('confirmRegistration', { occasionId: occasionId, occurrenceId: occurrenceId });
            (0, utility_1.writeLog)(`cancelCustomerRegistration. registration: ${registrationId}. event: ${registration.Occurrence.occasionId}. occurrence: ${registration.occurrenceId}`, "registration");
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`confirm registration ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
}
exports.MasterController = MasterController;
