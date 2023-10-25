"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntryController = void 0;
const constants_1 = require("../config/constants");
const models_1 = require("../models");
const utility_1 = require("../utility");
const sequelize_1 = require("sequelize");
class EntryController {
    static async ConsumeToken(req, res) {
        try {
            let token = req.body.token;
            if (!token) {
                res.sendStatus(constants_1.BAD_REQUEST);
            }
            else {
                let oldToken = await models_1.db.models.tokens.findByPk(token);
                if (oldToken == null) {
                    res.sendStatus(constants_1.NOT_ACCEPTABLE);
                }
                else {
                    let email = oldToken.target;
                    if (oldToken.type == 'new') {
                        let newToken = await models_1.db.models.tokens.create({ customerId: null, type: 'register', target: email });
                        await oldToken.destroy();
                        return res.send({ email: email, token: newToken.tokenId, type: 'register' });
                    }
                    else if (oldToken.type == 'forgot') {
                        let newToken = await models_1.db.models.tokens.create({ customerId: null, type: 'reset', target: email });
                        await oldToken.destroy();
                        return res.send({ email: email, token: newToken.tokenId, type: 'reset' });
                    }
                    else {
                        return res.sendStatus(constants_1.BAD_REQUEST);
                    }
                }
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`ConsumeToken ${JSON.stringify(e)}`, 'db');
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async RequestToken(req, res) {
        try {
            let email = req.body.email;
            let tokenType = res.locals.tokenType;
            if (!email || !tokenType) {
                res.sendStatus(constants_1.BAD_REQUEST);
            }
            else {
                if (tokenType == 'forgot') {
                    let customer = await models_1.db.models.customers.findOne({
                        where: { email: email },
                        attributes: ['customerId', 'email']
                    });
                    if (customer == null) {
                        return res.sendStatus(constants_1.CONFLICT_ERROR);
                    }
                    else {
                        await models_1.db.models.tokens.destroy({ where: { target: email } });
                        let token = models_1.db.models.tokens.build({ customerId: customer.customerId, type: 'forgot', target: email });
                        let emailContents = utility_1.Utility.buildMail(token.target, 'パスワードリセット', `ご利用ありがとうございます。\n以下のリンクを押してパスワードリセットに続けてください。\nhttps://${process.env.SITE_URI}/forgot?to=${token.tokenId}`);
                        await utility_1.Utility.sendMail(emailContents);
                        await token.save();
                        req.brute.reset(function () {
                            return res.sendStatus(constants_1.RESPONSE_SUCCESS);
                        });
                    }
                }
                else if (tokenType == 'new') {
                    let count = await models_1.db.models.customers.count({ where: { email: email } });
                    if (count > 0) {
                        res.sendStatus(constants_1.CONFLICT_ERROR);
                    }
                    else {
                        await models_1.db.models.tokens.destroy({ where: { target: email } });
                        let token = models_1.db.models.tokens.build({ customerId: null, type: 'new', target: email });
                        let emailContents = utility_1.Utility.buildMail(token.target, '新規登録・メール確認', `ご利用ありがとうございます。\n以下のリンクを押して登録してください。\nhttps://${process.env.SITE_URI}/register?to=${token.tokenId}`);
                        await utility_1.Utility.sendMail(emailContents);
                        await token.save();
                        req.brute.reset(function () {
                            return res.sendStatus(constants_1.RESPONSE_SUCCESS);
                        });
                    }
                }
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`RequestToken ${JSON.stringify(e)}`, 'db');
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async CustomerResetPassword(req, res) {
        let transaction = null;
        try {
            if (req.session.user) {
                req.session?.destroy(err => {
                    if (err)
                        console.warn(err);
                    else
                        res.clearCookie(process.env.SESS_NAME);
                });
            }
            let { token, password } = req.body;
            if (!token || !password) {
                throw new utility_1.DataConflictError(`invalid parameters ${JSON.stringify(req.body)}`);
            }
            transaction = await models_1.sequelize.transaction();
            let tokenDB = await models_1.db.models.tokens.findOne({ where: { tokenId: token, type: 'reset' }, transaction: transaction });
            if (tokenDB == null || !tokenDB.target) {
                await transaction.rollback();
                return res.sendStatus(constants_1.NOT_ACCEPTABLE);
            }
            else {
                let customer = await models_1.db.models.customers.findOne({ where: { email: tokenDB.target }, transaction: transaction });
                if (customer == null) {
                    throw new utility_1.DataConflictError(`customer with email: ${tokenDB.target} does not exist`);
                }
                let pwhash = await utility_1.Utility.createHash(password);
                await customer.update({ pwhash: pwhash }, { transaction: transaction });
                await transaction.commit();
                res.sendStatus(constants_1.RESPONSE_SUCCESS);
            }
        }
        catch (e) {
            if (transaction != null) {
                await transaction.rollback();
            }
            if (e instanceof utility_1.DataConflictError) {
                (0, utility_1.errLog)(`CustomerResetPassword DataConflictError ${e.message}`, 'db');
                res.sendStatus(constants_1.BAD_REQUEST);
            }
            else {
                (0, utility_1.errLog)(`CustomerResetPassword ${e.toString()} ${JSON.stringify(e)}`, 'db');
                res.sendStatus(constants_1.SYSTEM_ERROR);
            }
        }
    }
    static async CustomerSignup(req, res) {
        if (req.session.user) {
            return res.sendStatus(constants_1.SESSION_ERROR);
        }
        let transaction = null;
        try {
            let { token, firstName, lastName, firstNameKana, lastNameKana, telephone, zipPostal, prefecture, city, address, password, gender, dateOfBirth, q2inspectionCount, q3inspectionPurpose, q4isVaccinated, q5unvaccinatedReason, consent1, consent2 } = req.body;
            if (!token || !firstName || !lastName || !firstNameKana || !lastNameKana || !telephone || !zipPostal || !prefecture || !city || !address || !password || !gender || !dateOfBirth || q2inspectionCount === undefined || q3inspectionPurpose === undefined || !consent1 || !consent2) {
                throw new utility_1.DataConflictError(`invalid parameters ${JSON.stringify(req.body)}`);
            }
            transaction = await models_1.db.sequelize.transaction();
            let oldToken = await models_1.db.models.tokens.findByPk(token, { transaction: transaction });
            if (oldToken == null) {
                await transaction.rollback();
                return res.sendStatus(constants_1.NOT_ACCEPTABLE);
            }
            else {
                let emailCount = await models_1.db.models.customers.count({ where: { email: oldToken.target }, transaction: transaction });
                if (emailCount > 0) {
                    await transaction.rollback();
                    return res.sendStatus(constants_1.CONFLICT_ERROR);
                }
                else {
                    let pwhash = await utility_1.Utility.createHash(password);
                    let customer = await models_1.db.models.customers.create({
                        firstName: firstName, lastName: lastName, firstNameKana: firstNameKana, lastNameKana: lastNameKana,
                        email: oldToken.target, telephone: telephone, pwhash: pwhash,
                        zipPostal: zipPostal, prefecture: prefecture, city: city, address: address,
                        gender: gender, dateOfBirth: dateOfBirth,
                        q2inspectionCount: q2inspectionCount, q3inspectionPurpose: q3inspectionPurpose, q4isVaccinated: q4isVaccinated, q5unvaccinatedReason: q5unvaccinatedReason,
                        consent1: consent1, consent2: consent2
                    }, { transaction: transaction });
                    await oldToken.destroy({ transaction: transaction });
                    req.session.user = { customerId: customer.customerId, displayName: `${customer.lastName} ${customer.firstName}`, expires: constants_1.SESSION_EXPIRE_TIME };
                    res.cookie(process.env.SESS_NAME, { maxAge: (constants_1.SESSION_EXPIRE_TIME), sameSite: 'lax' });
                    await transaction.commit();
                    return res.sendStatus(constants_1.RESPONSE_SUCCESS);
                }
            }
        }
        catch (e) {
            if (transaction != null) {
                await transaction.rollback();
            }
            if (e instanceof utility_1.DataConflictError) {
                res.sendStatus(constants_1.BAD_REQUEST);
            }
            else {
                (0, utility_1.errLog)(`CustomerSignup ${JSON.stringify(e)} ${e.toString()}`, 'db');
                res.sendStatus(constants_1.SYSTEM_ERROR);
            }
        }
    }
    static async CustomerLogin(req, res) {
        try {
            if (!(req.body.username && req.body.password)) {
                return res.sendStatus(constants_1.PERMISSION_ERROR);
            }
            let customer = await models_1.db.models.customers.findOne({ where: { email: req.body.username, pwhash: { [sequelize_1.Op.not]: null } } });
            if (customer == null) {
                return res.sendStatus(constants_1.PERMISSION_ERROR);
            }
            let isMatch = await utility_1.Utility.comparePassword(req.body.password, customer.pwhash);
            if (isMatch) {
                req.session.user = { customerId: customer.customerId, displayName: `${customer.lastName} ${customer.firstName}`, expires: constants_1.SESSION_EXPIRE_TIME };
                res.cookie(process.env.SESS_NAME, { maxAge: (constants_1.SESSION_EXPIRE_TIME), sameSite: 'lax' });
                req.brute.reset(function () {
                    res.status(constants_1.RESPONSE_SUCCESS).send({ customerId: customer.customerId, role: 'customer' });
                });
            }
            else {
                return res.sendStatus(constants_1.PERMISSION_ERROR);
            }
        }
        catch (e) {
            console.warn(e);
            (0, utility_1.errLog)(`CustomerLogin ${JSON.stringify(e)}`, 'db');
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async Logout(req, res) {
        try {
            let role = null;
            if (req.session.user?.managerId) {
                role = { managerId: req.session.user.managerId, role: 'manager' };
            }
            else if (req.session.user?.customerId) {
                role = { customerId: req.session.user.customerId, role: 'customer' };
            }
            req.session?.destroy(err => {
                if (err) {
                    console.warn(err);
                    res.sendStatus(constants_1.SYSTEM_ERROR);
                }
                else {
                    res.clearCookie(process.env.SESS_NAME);
                    res.status(constants_1.RESPONSE_SUCCESS).send(role);
                }
            });
        }
        catch (e) {
            res.send(constants_1.SYSTEM_ERROR);
        }
    }
    static async MasterLogin(req, res) {
        try {
            let manager = await models_1.db.models.managers.findOne({
                where: { username: req.body.username }
            });
            if (manager == null) {
                return res.sendStatus(constants_1.PERMISSION_ERROR);
            }
            else {
                let isMatch = await utility_1.Utility.comparePassword(req.body.password, manager.pwhash);
                if (!isMatch) {
                    return res.sendStatus(constants_1.PERMISSION_ERROR);
                }
                req.session.user = {
                    managerId: manager.managerId,
                    expires: constants_1.SESSION_EXPIRE_TIME
                };
                res.cookie(process.env.SESS_NAME, { maxAge: (constants_1.SESSION_EXPIRE_TIME), sameSite: 'lax' });
                req.brute.reset(function () {
                    res.status(constants_1.RESPONSE_SUCCESS).send({ managerId: manager.managerId, role: 'manager' });
                });
            }
        }
        catch (e) {
            (0, utility_1.errLog)(`MasterLogin ${JSON.stringify(e)}`, 'db');
            return res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
}
exports.EntryController = EntryController;
