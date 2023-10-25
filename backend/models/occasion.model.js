"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Occasion = void 0;
const sequelize_1 = require("sequelize");
const occurrence_model_1 = require("./occurrence.model");
const registration_model_1 = require("./registration.model");
class Occasion extends sequelize_1.Model {
    static initClass(sequelize) {
        return Occasion.init({
            occasionId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            type: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
            title: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
            telephone: { type: sequelize_1.DataTypes.STRING(500), allowNull: false },
            address: { type: sequelize_1.DataTypes.STRING(200), allowNull: false },
            zipPostal: { type: sequelize_1.DataTypes.STRING(10), allowNull: false },
            timeCancel: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            textCancel: { type: sequelize_1.DataTypes.STRING(500), allowNull: true, defaultValue: null },
            canCancel: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            cancelMessage: { type: sequelize_1.DataTypes.STRING(1000), allowNull: true },
            regMessage: { type: sequelize_1.DataTypes.STRING(1000), allowNull: true },
            remindMessage: { type: sequelize_1.DataTypes.STRING(1000), allowNull: true },
            remindMessage1: { type: sequelize_1.DataTypes.STRING(1000), allowNull: true },
            limitTime: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            limitDays: { type: sequelize_1.DataTypes.SMALLINT, allowNull: true, defaultValue: null },
            limitHours: { type: sequelize_1.DataTypes.SMALLINT, allowNull: true, defaultValue: null },
            limitMinutes: { type: sequelize_1.DataTypes.SMALLINT, allowNull: true, defaultValue: null }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'occasions', modelName: 'Occasion', name: { singular: 'Occasion', plural: 'occasions' } });
    }
    static async occasionDetails(occasionId) {
        let occasion = await Occasion.findByPk(occasionId, {
            attributes: {
                exclude: ['textCancel', 'cancelMessage', 'regMessage', 'remindMessage', 'remindMessage1', 'createdAt', 'updatedAt', 'deletedAt']
            },
            raw: true
        });
        return occasion;
    }
    static async detailed(occasionId, occuWhere) {
        let occasionData = await Occasion.findByPk(occasionId, {
            attributes: {
                include: [
                    [(0, sequelize_1.fn)('MAX', (0, sequelize_1.col)('occurrences.startAt')), 'end'],
                    [(0, sequelize_1.fn)('MIN', (0, sequelize_1.col)('occurrences.startAt')), 'start'],
                    [(0, sequelize_1.cast)((0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('occurrences.maxAttendee')), 'signed'), 'maxCapacity'],
                ],
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            include: {
                association: Occasion.associations.occurrences,
                attributes: []
            }
        });
        if (occasionData == null)
            return null;
        occuWhere.occasionId = occasionData.occasionId;
        let sumExpected = 0, sumAttended = 0, maxCapacity = 0;
        let occurrences = await occurrence_model_1.Occurrence.findAll({
            where: occuWhere,
            attributes: {
                include: [[(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('startAt'), '%Y-%m-%d'), 'groupDate']],
                exclude: ['startTime', 'occasionId', 'createdAt', 'updatedAt', 'deletedAt']
            },
            include: {
                association: occurrence_model_1.Occurrence.associations.registrations,
                attributes: ['expected', 'attended']
            },
            order: [['startAt', 'ASC']]
        }).then(occus => occus.map(occu => {
            let o = occu.toJSON();
            o.sumExpected = 0;
            o.sumAttended = 0;
            o.registrations.forEach((regi) => {
                o.sumExpected += regi.expected;
                o.sumAttended += regi.attended;
            });
            maxCapacity += o.maxAttendee;
            sumExpected += o.sumExpected;
            sumAttended += o.sumAttended;
            o.registrations = undefined;
            return o;
        }));
        return { ...occasionData.toJSON(), sumExpected, sumAttended, occurrences };
    }
    static async overview(isMaster = false, type) {
        let currentOccurrences = await occurrence_model_1.Occurrence.findAll({ where: { startAt: { [sequelize_1.Op.gte]: (new Date) }, isDisplayed: true }, attributes: [[sequelize_1.Sequelize.literal('DISTINCT `occasionId`'), 'occasionId'], 'occasionId'] });
        let where = isMaster ? {} : { occasionId: { [sequelize_1.Op.in]: currentOccurrences.map(cO => cO.occasionId) } };
        let occasionAttrExclude = ['createdAt', 'updatedAt', 'deletedAt'];
        let occasionAttrInclude = [
            [(0, sequelize_1.fn)('MIN', (0, sequelize_1.col)('startAt')), 'start'], [(0, sequelize_1.fn)('MAX', (0, sequelize_1.col)('startAt')), 'end']
        ];
        if (!isMaster) {
            occasionAttrExclude.push('regMessage', 'remindMessage', 'remindMessage1');
            where.type = type;
        }
        else {
            occasionAttrInclude.push([(0, sequelize_1.cast)((0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('occurrences.registrations.expected')), 0), 'signed'), 'sumExpected'], [(0, sequelize_1.cast)((0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('occurrences.registrations.attended')), 0), 'signed'), 'sumAttended']);
        }
        let occasions = (await Occasion.findAll({
            attributes: {
                exclude: occasionAttrExclude,
                include: occasionAttrInclude
            },
            where: where,
            include: {
                association: Occasion.associations.occurrences,
                required: false,
                attributes: [],
                include: [{ association: occurrence_model_1.Occurrence.associations.registrations, attributes: [] }]
            },
            group: ['occasionId'],
            order: [[(0, sequelize_1.col)('occasionId'), 'DESC']]
        })).map(o => o.toJSON());
        let occurrencesData = await occurrence_model_1.Occurrence.findAll({
            where: { occasionId: { [sequelize_1.Op.in]: occasions.map(o => o.occasionId) } },
            attributes: [
                'occasionId',
                [(0, sequelize_1.cast)((0, sequelize_1.fn)('IFNULL', (0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('maxAttendee')), 0), 'signed'), 'maxCapacity']
            ],
            group: ['occasionId']
        });
        for await (let occu of occurrencesData) {
            let curOcca = occasions.find((occa) => occa.occasionId == occu.occasionId);
            if (curOcca != undefined) {
                curOcca.maxCapacity = occu.toJSON().maxCapacity;
            }
        }
        return occasions;
    }
    static async GetOccasionForNotification(occasionWhere, occurrenceWhere, registrationWhere, customerWhere) {
        let registrations = await Occasion.findAll({
            where: occasionWhere,
            include: {
                association: Occasion.associations.occurrences,
                where: occurrenceWhere,
                include: [{
                        association: occurrence_model_1.Occurrence.associations.registrations,
                        where: registrationWhere,
                        attributes: ['registrationId', 'customerId', 'isNotified', 'isNotified1'],
                        include: [{
                                association: registration_model_1.Registration.associations.Customer,
                                where: customerWhere,
                                attributes: ['firstName', 'lastName', 'email']
                            }]
                    }]
            }
        });
        return registrations;
    }
}
exports.Occasion = Occasion;
