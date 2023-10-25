"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccasionController = void 0;
const models_1 = require("../models");
const utility_1 = require("../utility");
const sequelize_1 = require("sequelize");
const constants_1 = require("../config/constants");
const server_1 = require("../../server");
const moment = require("moment");
const json2csv_1 = require("json2csv");
class OccasionController {
    static async create(req, res) {
        let newTransaction = await models_1.db.sequelize.transaction();
        try {
            let hasTimeLimit = req.body.limitTime == true ? true : false;
            let occasion = await models_1.db.models.occasions.create({
                type: req.body.type,
                title: req.body.title,
                telephone: req.body.telephone,
                address: req.body.address,
                zipPostal: req.body.zipPostal,
                timeCancel: req.body.timeCancel,
                textCancel: req.body.textCancel,
                canCancel: req.body.canCancel,
                cancelMessage: req.body.cancelMessage,
                remindMessage: req.body.remindMessage,
                remindMessage1: req.body.remindMessage1,
                regMessage: req.body.regMessage,
                limitTime: hasTimeLimit,
                limitDays: hasTimeLimit ? parseInt(req.body.limitDays) : null,
                limitHours: hasTimeLimit ? parseInt(req.body.limitHours) : null,
                limitMinutes: hasTimeLimit ? parseInt(req.body.limitMinutes) : null
            }, { transaction: newTransaction });
            if (Array.isArray(req.body.occurrences) && req.body.occurrences.length > 0) {
                let occurrencesData = req.body.occurrences.map((o) => {
                    let obj;
                    if (typeof o == 'string')
                        obj = { ...JSON.parse(o) };
                    else if (typeof o == 'object')
                        obj = { ...o };
                    let momentStart = moment(obj.startAt);
                    obj.occasionId = occasion.occasionId;
                    obj.startAt = momentStart.format('YYYY-MM-DD HH:mm:ss');
                    obj.startTime = momentStart.format('HH:mm:ss');
                    return obj;
                });
                await models_1.db.models.occurrences.bulkCreate(occurrencesData, { fields: ['startAt', 'endAt', 'startTime', 'maxAttendee', 'occasionId'], transaction: newTransaction });
            }
            await newTransaction.commit();
            server_1.io.emit('newEvent', { occasionId: occasion.occasionId });
            (0, utility_1.writeLog)(`create event: ${JSON.stringify(occasion.toJSON())}. times: ${JSON.stringify(req.body.occurrences)}`, "event");
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            await newTransaction.rollback();
            if (e instanceof sequelize_1.UniqueConstraintError)
                res.sendStatus(constants_1.CONFLICT_ERROR);
            else
                res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async listBasic(req, res) {
        try {
            res.send(await models_1.db.models.occasions.findAll({
                attributes: ['occasionId', 'title', 'type'],
                order: [['occasionId', 'DESC']],
                paranoid: false
            }));
        }
        catch (e) {
            (0, utility_1.errLog)(`event list basic ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async basicInfo(req, res) {
        try {
            res.send(await models_1.db.models.occasions.findByPk(req.params.occasionId, {
                attributes: { exclude: ['createdAt', 'updatedAt', 'deletedAt'] },
                paranoid: false
            }));
        }
        catch (e) {
            (0, utility_1.errLog)(`event basic info ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async overview(req, res) {
        try {
            let isMaster = res.locals.managerId ? true : false;
            let occasionType = req.query.type;
            if (!isMaster) {
                if (occasionType != 'pcr' && occasionType != 'antigen') {
                    throw `invalid occasion type ${occasionType}`;
                }
            }
            res.send(await models_1.db.models.occasions.overview(isMaster, occasionType));
        }
        catch (e) {
            (0, utility_1.errLog)(`overview occasion ${e.toString()}`, "api");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getUniqueDays(req, res) {
        let occasionId = parseInt(req.params.occasionId);
        try {
            let from = req.query.from;
            let to = req.query.to;
            if (from == null || to == null) {
                return res.sendStatus(constants_1.BAD_REQUEST);
            }
            let startAt = moment(from).format('YYYY-MM-DD 00:00:00');
            let endAt = moment(to).format('YYYY-MM-DD 23:59:59');
            if (!occasionId) {
                throw `invalid occasion id ${occasionId}`;
            }
            let days = await models_1.db.sequelize.query(`SELECT DISTINCT DATE_FORMAT(startAt, "%Y-%m-%d") as startAt
FROM (SELECT startAt, r.occurrenceId, IFNULL(SUM(r.expected), 0) AS sumExpected, o.maxAttendee
    FROM occurrences o 
    LEFT JOIN registrations r ON o.occurrenceId = r.occurrenceId AND r.deletedAt IS NULL 
    WHERE o.startAt BETWEEN '${startAt}' AND '${endAt}' AND o.startAt > "${moment().format('YYYY-MM-DD HH:mm:ss')}" AND o.isDisplayed = 1 AND o.deletedAt IS NULL AND o.occasionId = ${occasionId}
    GROUP BY o.occurrenceId) as s 
WHERE s.maxAttendee > s.sumExpected ORDER BY startAt ASC`, { type: sequelize_1.QueryTypes.SELECT });
            res.send(days.map(d => d.startAt));
        }
        catch (e) {
            (0, utility_1.errLog)(`getUniqueDays occasion ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getUniqueTimes(req, res) {
        let occasionId = parseInt(req.params.occasionId);
        let customerId = res.locals.customerId;
        let searchDate = req.query.date;
        try {
            if (searchDate == null) {
                return res.sendStatus(constants_1.BAD_REQUEST);
            }
            if (isNaN(customerId)) {
                return res.sendStatus(constants_1.SESSION_ERROR);
            }
            if (!occasionId) {
                throw `invalid occasion id ${occasionId}`;
            }
            let startAt = moment(searchDate).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            let endAt = moment(searchDate).endOf('day').format('YYYY-MM-DD HH:mm:ss');
            let times = await models_1.db.sequelize.query(`SELECT TIME_FORMAT(s.startTime, "%H:%i") as startAt, s.startAt startDate, s.occId occurrenceId
FROM (SELECT startTime, r.occurrenceId, o.occurrenceId occId, IFNULL(SUM(r.expected), 0) AS sumExpected, o.maxAttendee, o.startAt
    FROM occurrences o 
    LEFT JOIN registrations r ON o.occurrenceId = r.occurrenceId AND r.deletedAt IS NULL 
    WHERE o.startAt BETWEEN '${startAt}' AND '${endAt}' AND o.startAt > "${moment().format('YYYY-MM-DD HH:mm:ss')}" AND o.isDisplayed = 1 AND o.deletedAt IS NULL AND o.occasionId = ${occasionId}
    GROUP BY o.occurrenceId) as s 
WHERE s.maxAttendee > s.sumExpected ORDER BY startAt ASC`, { type: sequelize_1.QueryTypes.SELECT });
            if (times.length > 0) {
                let customerRegistrations = await models_1.db.sequelize.query(`SELECT o.startAt FROM registrations r JOIN occurrences o ON r.occurrenceId = o.occurrenceId AND o.deletedAt IS NULL AND o.startAt BETWEEN '${startAt}' AND '${endAt}'  
WHERE r.customerId = ${customerId} AND r.deletedAt IS NULL`, { raw: true, type: sequelize_1.QueryTypes.SELECT });
                if (customerRegistrations.length > 0) {
                    let newTimes = times
                        .filter(t => !customerRegistrations.some(cR => cR.startAt.toISOString() == t.startDate.toISOString()))
                        .map(cr => { return { startAt: cr.startAt, occurrenceId: cr.occurrenceId }; });
                    return res.send(newTimes);
                }
                else {
                    res.send(times);
                }
            }
            else {
                res.send(times);
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`overview occasion ${e.toString()}`, "api");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getEventScheduleSimple(req, res) {
        try {
            let isMaster = req.session.user?.managerId;
            let occasionId = parseInt(req.params.occasionId);
            if (!occasionId)
                throw `invalid parameter ${req.params.occasionId}`;
            let from = moment(req.query.from).startOf('day');
            let to = moment(req.query.to).add(1, 'day').endOf('day');
            let startTime = req.query.startTime;
            let startTimeWhere = (startTime && startTime.length == 5) ? ` AND o.startTime = '${startTime}' ` : '';
            if (isMaster) {
            }
            if (from.isValid() && to.isValid()) {
                let times = await models_1.db.sequelize.query(`SELECT s.startAt, s.endAt, s.occurrenceId
FROM (SELECT o.occurrenceId, o.startAt, o.endAt, IFNULL(SUM(r.expected), 0) AS sumExpected, o.maxAttendee
    FROM occurrences o 
    LEFT JOIN registrations r ON o.occurrenceId=r.occurrenceId AND r.deletedAt IS NULL 
    WHERE o.startAt BETWEEN '${from.format('YYYY-MM-DD HH:mm:ss')}' AND '${to.format('YYYY-MM-DD 00:00:00')}' AND o.deletedAt IS NULL AND o.occasionId = ${occasionId}${startTimeWhere}
    GROUP BY o.occurrenceId) as s 
WHERE s.maxAttendee > s.sumExpected`, { type: sequelize_1.QueryTypes.SELECT });
                return res.send(times.map(t => {
                    return { occurrenceId: t.occurrenceId, startAt: t.startAt, endAt: t.endAt };
                }));
            }
            else {
                res.sendStatus(constants_1.SYSTEM_ERROR);
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`getEventScheduleBasic occasion ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async downloadEventCSV(req, res) {
        let id = req.session.user?.managerId;
        try {
            let password = req.body.password;
            let occasionId = parseInt(req.params.occasionId);
            if (!id || !password || !occasionId) {
                throw new Error('password or occasionId not provided');
            }
            let manager = await models_1.db.models.managers.findOne({
                where: { managerId: id },
                attributes: ['managerId', 'pwhash']
            });
            if (manager == null) {
                throw new Error(`manager does not exist`);
            }
            let isMatch = await utility_1.Utility.comparePassword(password, manager.pwhash);
            if (isMatch) {
                let registrations = await models_1.db.models.registrations.findAll({
                    attributes: {
                        include: [
                            [(0, sequelize_1.col)('type'), '検査キット名'],
                            [(0, sequelize_1.literal)(`'2022-12-08'`), '発注日'],
                            [(0, sequelize_1.col)('registrationId'), '予約番号'],
                            [(0, sequelize_1.col)('Occurrence.occasionId'), 'occasionId'],
                            [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('startAt'), '%Y-%m-%d'), '予約日'],
                            [(0, sequelize_1.fn)('TIME_FORMAT', (0, sequelize_1.col)('startAt'), '%H:%i'), '予約時間'],
                            [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('Registration.createdAt'), '%Y-%m-%d'), '予約を入れた日'],
                            [(0, sequelize_1.fn)('TIME_FORMAT', (0, sequelize_1.col)('Registration.createdAt'), '%H:%i'), '予約を入れた時間'],
                            [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('startAt'), '%Y-%m-%d'), '検体採取日'],
                            [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('startAt'), '%Y-%m-%d'), '申込日'],
                            [(0, sequelize_1.fn)('CONCAT', (0, sequelize_1.col)('lastName'), '　', (0, sequelize_1.col)('firstName')), '氏名'], [(0, sequelize_1.fn)('CONCAT', (0, sequelize_1.col)('lastNameKana'), '　', (0, sequelize_1.col)('firstNameKana')), '氏名（フリガナ）'],
                            [(0, sequelize_1.fn)('DATE_FORMAT', (0, sequelize_1.col)('dateOfBirth'), '%Y-%m-%d'), '生年月日'], [(0, sequelize_1.col)('gender'), '性別'],
                            [(0, sequelize_1.col)('Customer.email'), 'メールアドレス'], [(0, sequelize_1.col)('Customer.telephone'), '電話番号'],
                            [(0, sequelize_1.col)('Customer.zipPostal'), '郵便番号'],
                            [(0, sequelize_1.fn)('CONCAT', (0, sequelize_1.col)('Customer.prefecture'), '　', (0, sequelize_1.col)('Customer.city')), '住所（自動入力）'],
                            [(0, sequelize_1.col)('Customer.address'), '住所（以降）'],
                            [(0, sequelize_1.col)('q2inspectionCount'), '検査利用回数'],
                            [(0, sequelize_1.col)('q3inspectionPurpose'), '検査目的'],
                            [(0, sequelize_1.col)('q4isVaccinated'), 'ワクチン接種状況'],
                            [(0, sequelize_1.col)('q5unvaccinatedReason'), 'ワクチン未接種理由'],
                            [(0, sequelize_1.col)('consent1'), '仮に検査結果が陽性であった場合には医療機関に受診します。'],
                            [(0, sequelize_1.col)('consent2'), '上記項目につき、虚偽がないことを証するとともに、本申込書は都道府県から求めがあった場合には都道府県に提出されることがあることについて同意します。'],
                            [(0, sequelize_1.literal)(`'1794'`), '事業者登録番号']
                        ]
                    },
                    include: [
                        {
                            association: models_1.db.models.registrations.associations.Occurrence,
                            attributes: [],
                            where: { occasionId: occasionId },
                            required: true,
                            include: [{
                                    association: models_1.db.models.occurrences.associations.Occasion,
                                    attributes: []
                                }]
                        }, {
                            association: models_1.db.models.registrations.associations.Customer,
                            attributes: [],
                            required: true
                        }
                    ],
                    raw: true,
                    nest: true
                }).then(rs => {
                    return rs.map((r) => {
                        if (r['性別'] == 'male') {
                            r['性別'] = '男性';
                        }
                        else if (r['性別'] == 'female') {
                            r['性別'] = '女性';
                        }
                        if (r['仮に検査結果が陽性であった場合には医療機関に受診します。'] == true) {
                            r['仮に検査結果が陽性であった場合には医療機関に受診します。'] = 'はい';
                        }
                        else {
                            r['仮に検査結果が陽性であった場合には医療機関に受診します。'] = 'いいえ';
                        }
                        if (r['上記項目につき、虚偽がないことを証するとともに、本申込書は都道府県から求めがあった場合には都道府県に提出されることがあることについて同意します。'] == true) {
                            r['上記項目につき、虚偽がないことを証するとともに、本申込書は都道府県から求めがあった場合には都道府県に提出されることがあることについて同意します。'] = 'はい';
                        }
                        else {
                            r['上記項目につき、虚偽がないことを証するとともに、本申込書は都道府県から求めがあった場合には都道府県に提出されることがあることについて同意します。'] = 'いいえ';
                        }
                        r['検査結果'] = '（判定前）';
                        if (r['検査キット名'] == 'pcr') {
                            r['発注日'] = '2022-01-28';
                            r['検査キット名'] = 'Ampdirect 2019-nCoV検出キット';
                        }
                        else if (r['検査キット名'] == 'antigen') {
                            r['発注日'] = '2022-12-08';
                            r['検査キット名'] = 'COVID-19抗原テスト「ニチレイバイオ」';
                        }
                        if (r['検査目的'] == 1) {
                            if (r['ワクチン接種状況'] == 1) {
                                r['ワクチン接種状況'] = 'はい';
                                r['ワクチン未接種理由'] = '';
                            }
                            else if (r['ワクチン接種状況'] == 2) {
                                r['ワクチン接種状況'] = 'いいえ';
                                if (r['ワクチン未接種理由'] == 1) {
                                    r['ワクチン未接種理由'] = '12歳未満である';
                                }
                                else if (r['ワクチン未接種理由'] == 2) {
                                    r['ワクチン未接種理由'] = '健康上の理由';
                                }
                                else if (r['ワクチン未接種理由'] == 3) {
                                    r['ワクチン未接種理由'] = 'その他（自己の意思等）';
                                }
                                else {
                                    r['ワクチン未接種理由'] = '';
                                }
                            }
                            else {
                                r['ワクチン接種状況'] = '';
                            }
                        }
                        else if (r['検査目的'] == 2) {
                            r['ワクチン接種状況'] = '';
                            r['ワクチン未接種理由'] = '';
                        }
                        else if (r['検査目的'] == 3) {
                            r['ワクチン接種状況'] = '';
                            r['ワクチン未接種理由'] = '';
                        }
                        r['本人確認担当者'] = '横田速人';
                        r['対象事業者ユーザー'] = '1794_s-ono@kowa.co.jp';
                        r['生年月日'] = moment(r['生年月日']);
                        r['生年月日'] = r['生年月日'].isValid() ? r['生年月日'].format('YYYY-MM-DD') : '';
                        r['参加時間'] = moment(r['参加時間']).format('YYYY-MM-DD HH:mm:ss');
                        r['予約番号'] = `${r.occasionId.toString().padStart(2, '0')}${r['予約番号'].toString().padStart(6, '0')}`;
                        return r;
                    });
                });
                const fields = ['予約日', '予約時間', '予約を入れた日', '予約を入れた時間', '事業者登録番号', '氏名', '検査キット名', '発注日', '検査結果', '住所（自動入力）', '住所（以降）', '検査利用回数', '検体採取日', '氏名（フリガナ）', '郵便番号', '電話番号', 'メールアドレス', '申込日', '本人確認担当者', '対象事業者ユーザー', '（その他　回数疎明を求めた際等に記入）', '仮に検査結果が陽性であった場合には医療機関に受診します。', '上記項目につき、虚偽がないことを証するとともに、本申込書は都道府県から求めがあった場合には都道府県に提出されることがあることについて同意します。', '生年月日', '性別', '予約番号', '検査目的', 'ワクチン接種状況', 'ワクチン未接種理由'];
                const opts = { fields: fields, withBOM: true, excelStrings: true };
                const csv = (0, json2csv_1.parse)(registrations, opts);
                res.setHeader("Content-Type", "text/csv");
                res.setHeader("Content-Disposition", "attachment; filename=occasion.csv");
                res.status(constants_1.RESPONSE_SUCCESS).end(csv);
            }
            else {
                res.sendStatus(constants_1.PERMISSION_ERROR);
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`download occasion CSV ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getEventProperties(req, res) {
        try {
            let occasionId = parseInt(req.params.occasionId);
            if (!occasionId)
                throw `invalid parameter ${req.params.occasionId}`;
            res.send(await models_1.db.models.occasions.occasionDetails(occasionId));
        }
        catch (e) {
            (0, utility_1.errLog)(`find occasion ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getEventDetailed(req, res) {
        try {
            let occasionId = parseInt(req.params.occasionId);
            if (!occasionId)
                throw `invalid parameter ${req.params.occasionId}`;
            let from = moment(req.query.from).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            let to = moment(req.query.to).add(1, 'day').endOf('day').format('YYYY-MM-DD 00:00:00');
            let occuWhere = {};
            if (from && to) {
                occuWhere.startAt = { [sequelize_1.Op.between]: [from, to] };
            }
            else if (from) {
                occuWhere.startAt = { [sequelize_1.Op.gte]: from };
            }
            else if (to) {
                occuWhere.startAt = { [sequelize_1.Op.lte]: to };
            }
            res.send(await models_1.db.models.occasions.detailed(occasionId, occuWhere));
        }
        catch (e) {
            (0, utility_1.errLog)(`find occasion ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async update(req, res) {
        let newTransaction = await models_1.db.sequelize.transaction();
        let occasionId = parseInt(req.params.occasionId);
        try {
            if (!occasionId) {
                throw `invalid occasion id ${occasionId}`;
            }
            let occasion = await models_1.db.models.occasions.findByPk(occasionId);
            if (occasion == null)
                throw `occasion does not exist ${occasionId}`;
            if (req.body.type != null)
                occasion.set({ type: req.body.type });
            if (req.body.title != null)
                occasion.set({ title: req.body.title });
            if (req.body.telephone != null)
                occasion.set({ telephone: req.body.telephone });
            if (req.body.address != null)
                occasion.set({ address: req.body.address });
            if (req.body.zipPostal != null)
                occasion.set({ zipPostal: req.body.zipPostal });
            if (req.body.timeCancel)
                occasion.set({ timeCancel: req.body.timeCancel });
            if (req.body.textCancel != null)
                occasion.set({ textCancel: req.body.textCancel });
            if (req.body.canCancel != null)
                occasion.set({ canCancel: req.body.canCancel });
            if (req.body.cancelMessage != null)
                occasion.set({ cancelMessage: req.body.cancelMessage });
            if (req.body.regMessage != null)
                occasion.set({ regMessage: req.body.regMessage });
            if (req.body.remindMessage != null)
                occasion.set({ remindMessage: req.body.remindMessage });
            if (req.body.remindMessage1 != null)
                occasion.set({ remindMessage1: req.body.remindMessage1 });
            if (req.body.limitTime != null) {
                if (req.body.limitTime == true) {
                    occasion.set({ limitTime: true, limitDays: parseInt(req.body.limitDays), limitHours: parseInt(req.body.limitHours), limitMinutes: parseInt(req.body.limitMinutes) });
                }
                else {
                    occasion.set({ limitTime: false });
                }
            }
            if (occasion.changed())
                await occasion.save({ transaction: newTransaction });
            await newTransaction.commit();
            server_1.io.emit('updateEvent', { occasionId: occasion.occasionId });
            (0, utility_1.writeLog)(`update event ${occasionId}. params: ${JSON.stringify(req.body)}`, 'event');
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            await newTransaction.rollback();
            (0, utility_1.errLog)(`update occasion ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async delete(req, res) {
        let newTransaction = await models_1.db.sequelize.transaction();
        let occasionId = parseInt(req.params.occasionId);
        try {
            if (!occasionId) {
                throw `invalid occasion id ${occasionId}`;
            }
            let occasion = await models_1.db.models.occasions.findByPk(occasionId);
            if (occasion == null)
                throw `occasion does not exist ${occasionId}`;
            let occurrences = (await models_1.db.models.occurrences.findAll({ where: { occasionId: req.params.occasionId }, attributes: ['occurrenceId'], transaction: newTransaction })).map(o => o.occurrenceId);
            await models_1.db.models.registrations.destroy({ where: { occurrenceId: { [sequelize_1.Op.in]: occurrences } }, transaction: newTransaction });
            await models_1.db.models.occurrences.destroy({ where: { occasionId: req.params.occasionId }, transaction: newTransaction });
            await occasion.destroy({ transaction: newTransaction });
            await newTransaction.commit();
            server_1.io.emit('deleteEvent', { occasionId: occasionId });
            (0, utility_1.writeLog)(`delete event ${occasionId}`, "event");
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            await newTransaction.rollback();
            (0, utility_1.errLog)(`delete occasion ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
}
exports.OccasionController = OccasionController;
