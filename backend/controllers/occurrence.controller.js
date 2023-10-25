"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccurrenceController = void 0;
const models_1 = require("../models");
const utility_1 = require("../utility");
const sequelize_1 = require("sequelize");
const constants_1 = require("../config/constants");
const server_1 = require("../../server");
const moment = require("moment");
class OccurrenceController {
    static async create(req, res) {
        try {
            res.send(await models_1.db.models.occurrences.create(req.body));
        }
        catch (e) {
            (0, utility_1.errLog)(`create occurrence ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async browse(req, res) {
        try {
            res.send(await models_1.db.models.occurrences.findAndCountAll());
        }
        catch (e) {
            (0, utility_1.errLog)(`browse occurrences ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async find(req, res) {
        try {
            let occurrenceId = parseInt(req.params.occurrenceId);
            if (!occurrenceId) {
                throw `invalid occurrence id ${occurrenceId}`;
            }
            res.send(await models_1.db.models.occurrences.detailed(occurrenceId));
        }
        catch (e) {
            console.warn(e);
            (0, utility_1.errLog)(`find occurrence ${req.params.occurrenceId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async update(req, res) {
        try {
            let occurrenceId = req.params.occurrenceId;
            if (!occurrenceId) {
                throw `invalid occurrence id ${occurrenceId}`;
            }
            let occurrence = await models_1.db.models.occurrences.findByPk(occurrenceId, {
                attributes: {
                    include: [[(0, sequelize_1.cast)((0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('registrations.expected')), 0), 'signed'), 'sumExpected']],
                },
                include: {
                    association: models_1.db.models.occurrences.associations.registrations,
                    attributes: []
                }
            });
            let { maxAttendee, isDisplayed } = req.body;
            if (occurrence == null) {
                throw `occurrence does not exist`;
            }
            if (maxAttendee != null) {
                if (occurrence.sumExpected > maxAttendee) {
                    throw `occurrence.sumExpected ${occurrence.sumExpected} > maxAttendee ${maxAttendee}`;
                }
                else {
                    occurrence.set({ maxAttendee: maxAttendee });
                }
            }
            if (isDisplayed != null) {
                occurrence.set({ isDisplayed: isDisplayed });
            }
            if (occurrence.changed()) {
                await occurrence.save();
                server_1.io.emit('updateOccurrence', { occasionId: occurrence.occasionId, occurrenceId: occurrence.occurrenceId });
                (0, utility_1.writeLog)(`update occurrence ${occurrenceId}. params: ${JSON.stringify(req.body)}`, 'occurrence');
                res.sendStatus(constants_1.RESPONSE_SUCCESS);
            }
            else {
                res.sendStatus(constants_1.RESPONSE_SUCCESS);
            }
        }
        catch (e) {
            if (e.msg) {
                (0, utility_1.errLog)(`update occurrence ${req.params.occurrenceId}: ${e.toString()}`, "db");
                res.sendStatus(constants_1.CONFLICT_ERROR);
            }
            else {
                (0, utility_1.errLog)(`update occurrence ${req.params.occurrenceId}: ${e.toString()}`, "db");
                res.sendStatus(constants_1.SYSTEM_ERROR);
            }
        }
    }
    static async editOccurrences(req, res) {
        let occasionId = parseInt(req.body.occasionId);
        try {
            let occurrenceData = req.body.occurrences;
            for (const od of occurrenceData) {
                od.startTime = moment(od.startAt).format('HH:mm');
            }
            if (!occasionId || !occurrenceData.length)
                throw `invalid parameters ${JSON.stringify({ occasionId, occurrences: occurrenceData })}`;
            let occurrences = (await models_1.db.models.occurrences.findAll({
                attributes: ['occurrenceId', 'startAt', 'startTime', 'endAt', 'deletedAt'],
                where: { occasionId: occasionId, startAt: { [sequelize_1.Op.in]: occurrenceData.map(o => o.startAt) } }, paranoid: false
            }));
            let confirmedOccurrences = [];
            let toNotify = [];
            occurrenceData.forEach(orb => {
                let orbDate = new Date(orb.startAt).getMinutes();
                let odb = occurrences.find(o => { return 0 == new Date(o.startAt).getMinutes() - orbDate; });
                if (odb == null || odb.deletedAt != null) {
                    confirmedOccurrences.push({ maxAttendee: orb.maxAttendee, occasionId: occasionId, startAt: orb.startAt, startTime: orb.startTime, endAt: orb.endAt, deletedAt: null });
                }
                else {
                    toNotify.push(odb);
                }
            });
            if (confirmedOccurrences.length > 0) {
                await models_1.db.models.occurrences.bulkCreate(confirmedOccurrences, { fields: ['maxAttendee', 'occasionId', 'startAt', 'endAt', 'startTime'], updateOnDuplicate: ['maxAttendee', 'deletedAt'] });
            }
            server_1.io.emit('updateOccurrence', { occasionId: occasionId });
            (0, utility_1.writeLog)(`editOccurrences. event ${occasionId}. params: ${JSON.stringify(req.body)}`, 'occurrence');
            if (toNotify.length == 0) {
                res.sendStatus(constants_1.RESPONSE_SUCCESS);
            }
            else {
                res.status(constants_1.RESPONSE_SUCCESS).send({ unchanged: toNotify });
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`update occurrences of occasion ${occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async delete(req, res) {
        let newTransaction = await models_1.db.sequelize.transaction();
        let occurrenceId = parseInt(req.params.occurrenceId);
        try {
            if (!occurrenceId) {
                throw `invalid occurrence id ${occurrenceId}`;
            }
            let occurrence = await models_1.db.models.occurrences.findByPk(occurrenceId);
            if (occurrence == null)
                throw `occurrence does not exist occurrenceId: ${req.params.occurrenceId}`;
            let occasionId = occurrence.occasionId;
            await occurrence.destroy({ transaction: newTransaction });
            await models_1.db.models.registrations.destroy({ where: { occurrenceId: occurrence.occurrenceId }, transaction: newTransaction });
            await newTransaction.commit();
            server_1.io.emit('deleteOccurrence', { occasionId: occasionId });
            (0, utility_1.writeLog)(`delete occurrence. event ${occasionId} occurrence ${occurrenceId}`, 'occurrence');
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            await newTransaction.rollback();
            (0, utility_1.errLog)(`delete occurrence ${occurrenceId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
}
exports.OccurrenceController = OccurrenceController;
