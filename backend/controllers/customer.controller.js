"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const models_1 = require("../models");
const utility_1 = require("../utility");
const registration_model_1 = require("../models/registration.model");
const sequelize_1 = require("sequelize");
const constants_1 = require("../config/constants");
const server_1 = require("../../server");
const occurrence_model_1 = require("../models/occurrence.model");
const moment = require("moment");
const notification_controller_1 = require("./notification.controller");
const json2csv_1 = require("json2csv");
class CustomerController {
    static async getSelf(customerId) {
        try {
            return await models_1.db.models.customers.findByPk(customerId, {
                attributes: { exclude: ['pwhash', 'isManual', 'isManual', 'createdAt', 'updatedAt', 'deletedAt'] }
            });
        }
        catch (e) {
            (0, utility_1.errLog)(`getSelf ${e.toString()}`, "api");
            return null;
        }
    }
    static async updateSelf(customerId, params) {
        let c = await models_1.db.models.customers.findByPk(customerId);
        if (c == null)
            throw `customer does not exist ${customerId}`;
        if (!params.consent1 || !params.consent2) {
            throw 'consent1 or consent2 not true';
        }
        if (params.firstName !== undefined) {
            c.set({ firstName: params.firstName });
        }
        if (params.lastName !== undefined) {
            c.set({ lastName: params.lastName });
        }
        if (params.firstNameKana !== undefined) {
            c.set({ firstNameKana: params.firstNameKana });
        }
        if (params.lastNameKana !== undefined) {
            c.set({ lastNameKana: params.lastNameKana });
        }
        if (params.telephone !== undefined) {
            c.set({ telephone: params.telephone });
        }
        if (params.zipPostal !== undefined) {
            c.set({ zipPostal: params.zipPostal });
        }
        if (params.prefecture !== undefined) {
            c.set({ prefecture: params.prefecture });
        }
        if (params.city !== undefined) {
            c.set({ city: params.city });
        }
        if (params.address !== undefined) {
            c.set({ address: params.address });
        }
        if (params.gender) {
            c.set({ gender: params.gender });
        }
        if (params.dateOfBirth) {
            c.set({ dateOfBirth: params.dateOfBirth });
        }
        if (params.q2inspectionCount !== undefined) {
            c.set({ q2inspectionCount: params.q2inspectionCount });
        }
        if (params.q3inspectionPurpose !== undefined) {
            c.set({ q3inspectionPurpose: params.q3inspectionPurpose });
        }
        if (params.q4isVaccinated !== undefined) {
            if (params.q4isVaccinated == 2 && params.q5unvaccinatedReason) {
                c.set({ q4isVaccinated: params.q4isVaccinated, q5unvaccinatedReason: params.q5unvaccinatedReason });
            }
            else if (params.q4isVaccinated == 1) {
                c.set({ q4isVaccinated: params.q4isVaccinated, q5unvaccinatedReason: null });
            }
        }
        if (c.q3inspectionPurpose != 1) {
            c.set({ q4isVaccinated: null, q5unvaccinatedReason: null });
        }
        if (params.password !== undefined) {
            let pwhash = await utility_1.Utility.createHash(params.password);
            c.set({ pwhash: pwhash });
        }
        if (params.consent1) {
            c.set({ consent1: params.consent1 });
        }
        if (params.consent2) {
            c.set({ consent2: params.consent2 });
        }
        if (c.changed())
            await c.save();
        (0, utility_1.writeLog)(`updateSelf. customer ${customerId}. params: ${JSON.stringify(params)}`, 'customer');
        return c.getBasicInfo();
    }
    static async delete(req, res) {
        try {
            if (!req.params.customerId)
                throw 'invalid parameters';
            await models_1.db.models.customers.destroy({ where: { customerId: req.params.customerId } });
            (0, utility_1.writeLog)(`delete customer: ${req.params.customerId}.`, "customer");
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`delete customer ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async myRegistrations(customerId) {
        let today = moment().format('YYYY-MM-DD 00:00:00');
        return await registration_model_1.Registration.findAll({
            where: { customerId: customerId },
            attributes: ['registrationId', 'expected', 'attended', 'occurrenceId',
                [(0, sequelize_1.col)('startAt'), 'startAt'], [(0, sequelize_1.col)('Occurrence.occasionId'), 'occasionId'],
                [(0, sequelize_1.col)('title'), 'title'], [(0, sequelize_1.col)('telephone'), 'telephone'], [(0, sequelize_1.col)('address'), 'address'], [(0, sequelize_1.col)('zipPostal'), 'zipPostal'],
                [(0, sequelize_1.col)('timeCancel'), 'timeCancel'], [(0, sequelize_1.col)('textCancel'), 'textCancel'], [(0, sequelize_1.col)('canCancel'), 'canCancel'], [(0, sequelize_1.col)('type'), 'type']
            ],
            include: {
                association: registration_model_1.Registration.associations.Occurrence,
                where: { startAt: { [sequelize_1.Op.gte]: today } },
                attributes: [],
                include: [{
                        association: occurrence_model_1.Occurrence.associations.Occasion,
                        attributes: []
                    }]
            },
            order: [['createdAt', 'desc']]
        });
    }
    static async registerForEvent(customerId, params) {
        if (params.occurrenceId == null || params.expected == null)
            throw `invalid parameter ${JSON.stringify(params)}`;
        let newRegi;
        let c = await models_1.db.models.customers.findByPk(customerId, {
            attributes: ['customerId', 'firstName', 'lastName', 'email']
        });
        if (c == null) {
            throw `customer ${customerId} does not exist`;
        }
        let occu = await models_1.db.models.occurrences.findByPk(params.occurrenceId, {
            attributes: ['occurrenceId', 'occasionId', 'maxAttendee', 'startAt', 'endAt'],
            include: [{
                    association: models_1.db.models.occurrences.associations.Occasion,
                    attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                    required: true
                }, {
                    association: models_1.db.models.occurrences.associations.registrations,
                    attributes: ['registrationId', 'customerId', 'expected']
                }]
        });
        if (occu == null) {
            throw `occasion does not match ${JSON.stringify(params)}`;
        }
        if (occu.Occasion == null) {
            throw `occasion of occurrence: ${occu.occurrenceId} is null`;
        }
        if (occu.isDisplayed == false) {
            throw `trying to register to a hidden occurrence occurrence: ${occu.occurrenceId}`;
        }
        let dayStart = moment(occu.startAt).startOf('day').toDate();
        let dayEnd = moment(occu.startAt).endOf('day').toDate();
        let sameDayRegis = await models_1.db.models.registrations.findAll({
            attributes: ['registrationId'],
            where: { customerId: customerId },
            include: {
                attributes: ['occurrenceId', 'startAt'],
                association: models_1.db.models.registrations.associations.Occurrence,
                where: { startAt: { [sequelize_1.Op.between]: [dayStart, dayEnd] } },
                required: true
            }
        });
        if (sameDayRegis.length > 0) {
            throw { msg: `sameDayRegis ${sameDayRegis.map(r => r.registrationId).toString()}`, errCode: constants_1.BAD_REQUEST };
        }
        if (occu.Occasion.limitTime) {
            let deadLine = moment(occu.startAt)
                .subtract(occu.Occasion.limitDays, "days")
                .hour(occu.Occasion.limitHours)
                .minute(occu.Occasion.limitMinutes)
                .second(0)
                .add(9, 'hours');
            let now = moment().add(9, 'hours');
            let isAfter = deadLine.isAfter(now);
            if (!isAfter) {
                let logMsg = `isBefore: ${isAfter}\noccuDate: ${moment(occu.startAt).toISOString()}\ndeadLine: ${deadLine.toISOString()}\nnow: ${now.toISOString()} `;
                (0, utility_1.writeLog)(logMsg, "debug");
                throw { msg: logMsg, errCode: constants_1.NOT_ACCEPTABLE };
            }
        }
        let prevRegis = await models_1.db.models.registrations.findAll({
            where: { customerId: c.customerId },
            attributes: ['registrationId'],
            include: {
                association: models_1.db.models.registrations.associations.Occurrence,
                attributes: ['occurrenceId', 'startAt'],
                where: {
                    [sequelize_1.Op.or]: [
                        { startAt: { [sequelize_1.Op.between]: [occu.startAt, occu.endAt] } },
                        { endAt: { [sequelize_1.Op.between]: [occu.startAt, occu.endAt] } }
                    ]
                },
                required: true,
                include: [{
                        association: models_1.db.models.occurrences.associations.Occasion,
                        attributes: ['occasionId', 'type']
                    }]
            }
        });
        if (prevRegis.length > 0) {
            throw { msg: `cannot overlap ${occu.occurrenceId} ${occu.startAt.toISOString()}. previous registrations ${JSON.stringify(prevRegis)}`, errCode: constants_1.CONFLICT_ERROR };
        }
        let expected = params.expected;
        if (expected == 0) {
            throw `count expected is ${expected} == 0`;
        }
        if (occu.registrations) {
            if (occu.registrations.some(r => r.customerId == c.customerId)) {
                throw `already registered ${customerId} ${JSON.stringify(params)}`;
            }
            else {
                let sumExp = occu.registrations.reduce((sum, cur) => sum + cur.expected, 0);
                if (occu.maxAttendee < sumExp + expected) {
                    throw { msg: `${occu.occurrenceId} registration over the limit ${occu.maxAttendee} < ${sumExp}`, errCode: constants_1.NOT_ACCEPTABLE };
                }
            }
        }
        newRegi = await registration_model_1.Registration.create({ customerId: c.customerId, occurrenceId: occu.occurrenceId, expected: expected });
        if (newRegi == null)
            throw `user ${customerId} could not create registration ${JSON.stringify(params)}`;
        if (occu.Occasion.regMessage) {
            await notification_controller_1.NotificationController.notifyGuestEmail({ lastName: c.lastName, firstName: c.firstName, email: c.email }, { title: occu.Occasion.type == 'pcr' ? 'PCR検査のご予約完了' : '抗原性検査のご予約完了', time: occu.startAt, message: occu.Occasion.regMessage });
        }
        server_1.io.emit('newRegistration', { occasionId: occu.Occasion.occasionId, occurrenceId: occu.occurrenceId });
        (0, utility_1.writeLog)(`registerForEvent. customer ${customerId}. event: ${occu.occasionId}. time: ${occu.occurrenceId}`, 'registration');
        return newRegi;
    }
    static async cancelRegistration(customerId, params) {
        if (!params.registrationId)
            throw `registration does not exist ${params.registrationId}`;
        let r = await registration_model_1.Registration.findOne({
            attributes: ['registrationId', 'expected', 'isNotified', 'attended'],
            where: {
                registrationId: params.registrationId,
                attended: 0
            },
            include: [
                {
                    association: models_1.db.models.registrations.associations.Customer,
                    where: { customerId: customerId },
                    attributes: ['customerId', 'email', 'firstName', 'lastName']
                },
                {
                    association: models_1.db.models.registrations.associations.Occurrence,
                    attributes: ['occurrenceId', 'startAt', 'endAt'],
                    include: [{
                            association: models_1.db.models.occurrences.associations.Occasion,
                            attributes: ['occasionId', 'type', 'timeCancel', 'canCancel', 'cancelMessage'],
                            where: { canCancel: true },
                        }]
                }
            ]
        });
        if (r == null || r.Customer == null)
            throw `registrationId does not exist rid: ${params.registrationId} or has no customer`;
        if (!r.Occurrence?.Occasion)
            throw `event not cancellable. occasionId: ${JSON.stringify(r)}`;
        if (r.attended > 0) {
            throw { msg: `already ${r.attended} attened rid: ${r.registrationId}`, errCode: constants_1.NOT_ACCEPTABLE };
        }
        if (r.Occurrence.Occasion.timeCancel != null) {
            let now = moment();
            let startAt = moment(r.Occurrence.startAt);
            if (startAt.diff(now, 'minutes') < r.Occurrence.Occasion.timeCancel) {
                throw `cancel time expired ${startAt.format('YYYY-MM-DD HH:mm:ss')} - ${now.format('YYYY-MM-DD HH:mm:ss')} > ${r.Occurrence.Occasion.timeCancel} minutes`;
            }
        }
        let occasionId = r.Occurrence.Occasion.occasionId;
        let occurrenceId = r.Occurrence.occurrenceId;
        r.set('cancelledAt', new Date());
        if (r.Occurrence.Occasion.cancelMessage) {
            await notification_controller_1.NotificationController.notifyGuestEmail({ lastName: r.Customer.lastName, firstName: r.Customer.firstName, email: r.Customer.email }, { title: r.Occurrence.Occasion.type == 'pcr' ? 'PCR検査のご予約キャンセル' : '抗原性検査のご予約キャンセル', time: r.Occurrence.startAt, message: r.Occurrence.Occasion.cancelMessage });
        }
        await r.save().then(r => r.destroy());
        server_1.io.emit('cancelRegistration', { occasionId: occasionId, occurrenceId: occurrenceId });
        (0, utility_1.writeLog)(`cancelRegistration. customer ${customerId}. registration: ${params.registrationId}. event: ${r.Occurrence.Occasion.occasionId}. time: ${r.Occurrence.occurrenceId}`, 'registration');
        return;
    }
    static async getCustomersCSV(req, res) {
        try {
            let customers = await models_1.db.models.customers.findAll({
                attributes: [
                    ['customerId', 'ユーザID'],
                    [(0, sequelize_1.fn)('CONCAT', (0, sequelize_1.col)('lastName'), '　', (0, sequelize_1.col)('firstName')), '氏名'],
                    [(0, sequelize_1.fn)('CONCAT', (0, sequelize_1.col)('lastNameKana'), '　', (0, sequelize_1.col)('firstNameKana')), '氏名（フリガナ）'],
                    [(0, sequelize_1.col)('zipPostal'), '郵便番号'],
                    [(0, sequelize_1.fn)('CONCAT', (0, sequelize_1.col)('prefecture'), '　', (0, sequelize_1.col)('city')), '住所（自動入力）'],
                    [(0, sequelize_1.col)('address'), '住所（以降）']
                ]
            }).then(cs => cs.map(c => c.toJSON()));
            const fields = ['ユーザID', '氏名', '氏名（フリガナ）', '郵便番号', '住所（自動入力）', '住所（以降）'];
            const opts = { fields: fields, withBOM: true };
            const csv = (0, json2csv_1.parse)(customers, opts);
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=occasion.csv");
            res.status(constants_1.RESPONSE_SUCCESS).end(csv);
        }
        catch (e) {
            (0, utility_1.errLog)(`getCustomersCSV error: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
}
exports.CustomerController = CustomerController;
