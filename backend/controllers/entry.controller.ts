import { BAD_REQUEST, CONFLICT_ERROR, NOT_ACCEPTABLE, PERMISSION_ERROR, RESPONSE_SUCCESS, SESSION_ERROR, SESSION_EXPIRE_TIME, SYSTEM_ERROR } from "../config/constants";
import { Request, Response } from "express";
import { db, sequelize } from "../models";
import { DataConflictError, errLog, Utility } from "../utility";
import { BaseError, Op, Transaction, UniqueConstraintError } from "sequelize";
import { tokenBruteforce, loginBruteforce } from "../utility/apiLimiter";
export class EntryController {
    static async ConsumeToken(req: Request, res: Response) {
        try {
            let token = req.body.token
            if (!token) {
                res.sendStatus(BAD_REQUEST)
            } else {
                let oldToken = await db.models.tokens.findByPk(token)
                if (oldToken == null) {
                    res.sendStatus(NOT_ACCEPTABLE)
                } else {
                    let email = oldToken.target
                    if (oldToken.type == 'new') {
                        // await oldToken.destroy()
                        let newToken = await db.models.tokens.create({ customerId: null, type: 'register', target: email })
                        await oldToken.destroy()
                        return res.send({ email: email, token: newToken.tokenId, type: 'register' })
                    } else if (oldToken.type == 'forgot') {
                        // await oldToken.destroy()
                        let newToken = await db.models.tokens.create({ customerId: null, type: 'reset', target: email })
                        await oldToken.destroy()
                        return res.send({ email: email, token: newToken.tokenId, type: 'reset' })
                    } else {
                        return res.sendStatus(BAD_REQUEST)
                    }
                }
            }
        } catch (e) {
            errLog(`ConsumeToken ${JSON.stringify(e)}`, 'db')
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    //RegisterEmail & Forgot password
    static async RequestToken(req: Request, res: Response) {
        try {
            let email = req.body.email
            let tokenType = res.locals.tokenType
            if (!email || !tokenType) {
                res.sendStatus(BAD_REQUEST)
            } else {
                if (tokenType == 'forgot') {
                    let customer = await db.models.customers.findOne({
                        where: { email: email },
                        attributes: ['customerId', 'email']
                    })
                    if (customer == null) {
                        //EMAIL DOES NOT EXIST
                        return res.sendStatus(CONFLICT_ERROR)
                    } else {
                        //send email to reset password
                        await db.models.tokens.destroy({ where: { target: email } })
                        let token = db.models.tokens.build({ customerId: customer.customerId, type: 'forgot', target: email })
                        let emailContents = Utility.buildMail(token.target, 'パスワードリセット', `ご利用ありがとうございます。\n以下のリンクを押してパスワードリセットに続けてください。\nhttps://${process.env.SITE_URI}/forgot?to=${token.tokenId}`)
                        // errLog(`forgot ${JSON.stringify(emailContents)}`, 'api')
                        await Utility.sendMail(emailContents)
                        await token.save()
                        req.brute!.reset!(function () {
                            return res.sendStatus(RESPONSE_SUCCESS)
                        })
                    }
                } else if (tokenType == 'new') {
                    let count = await db.models.customers.count({ where: { email: email } })
                    if (count > 0) {
                        //CUSTOMER WITH EMAIL ALREADY EXISTS
                        res.sendStatus(CONFLICT_ERROR)
                    } else {
                        //send email to register
                        await db.models.tokens.destroy({ where: { target: email } })
                        let token = db.models.tokens.build({ customerId: null, type: 'new', target: email })
                        let emailContents = Utility.buildMail(token.target, '新規登録・メール確認', `ご利用ありがとうございます。\n以下のリンクを押して登録してください。\nhttps://${process.env.SITE_URI}/register?to=${token.tokenId}`)
                        // errLog(`new ${JSON.stringify(emailContents)}`, 'api')
                        await Utility.sendMail(emailContents)
                        await token.save()
                        req.brute!.reset!(function () {
                            return res.sendStatus(RESPONSE_SUCCESS)
                        })
                    }
                }
            }
        } catch (e) {
            errLog(`RequestToken ${JSON.stringify(e)}`, 'db')
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async CustomerResetPassword(req: Request, res: Response) {
        let transaction = null
        try {
            if (req.session.user) {
                req.session?.destroy(err => {
                    if (err) console.warn(err)
                    else res.clearCookie(process.env.SESS_NAME as string)
                })
            }
            let { token, password } = req.body
            if (!token || !password) { throw new DataConflictError(`invalid parameters ${JSON.stringify(req.body)}`) }
            transaction = await sequelize.transaction()
            let tokenDB = await db.models.tokens.findOne({ where: { tokenId: token, type: 'reset' }, transaction: transaction })
            if (tokenDB == null || !tokenDB.target) {
                await transaction.rollback()
                return res.sendStatus(NOT_ACCEPTABLE)
            } else {
                let customer = await db.models.customers.findOne({ where: { email: tokenDB.target }, transaction: transaction })
                if (customer == null) { throw new DataConflictError(`customer with email: ${tokenDB.target} does not exist`) }
                let pwhash = await Utility.createHash(password)
                await customer.update({ pwhash: pwhash }, { transaction: transaction })
                await transaction.commit()
                res.sendStatus(RESPONSE_SUCCESS)
            }
        } catch (e: any) {
            if (transaction != null) { await transaction.rollback() }
            if (e instanceof DataConflictError) {
                errLog(`CustomerResetPassword DataConflictError ${e.message}`, 'db')
                res.sendStatus(BAD_REQUEST)
            } else {
                errLog(`CustomerResetPassword ${e.toString()} ${JSON.stringify(e)}`, 'db')
                res.sendStatus(SYSTEM_ERROR)
            }
        }
    }
    static async CustomerSignup(req: Request, res: Response) {
        if (req.session.user) {
            return res.sendStatus(SESSION_ERROR)
        }
        let transaction = null
        try {
            let { token, firstName, lastName, firstNameKana, lastNameKana, telephone, zipPostal, prefecture, city, address, password, gender, dateOfBirth, q2inspectionCount, q3inspectionPurpose, q4isVaccinated, q5unvaccinatedReason, consent1, consent2 } = req.body
            if (!token || !firstName || !lastName || !firstNameKana || !lastNameKana || !telephone || !zipPostal || !prefecture || !city || !address || !password || !gender || !dateOfBirth || q2inspectionCount === undefined || q3inspectionPurpose === undefined || !consent1 || !consent2) {
                throw new DataConflictError(`invalid parameters ${JSON.stringify(req.body)}`)
            }
            transaction = await db.sequelize.transaction()
            let oldToken = await db.models.tokens.findByPk(token, { transaction: transaction })
            if (oldToken == null) {
                await transaction.rollback()
                return res.sendStatus(NOT_ACCEPTABLE)
            } else {
                let emailCount = await db.models.customers.count({ where: { email: oldToken.target }, transaction: transaction })
                if (emailCount > 0) {
                    await transaction.rollback()
                    return res.sendStatus(CONFLICT_ERROR)
                } else {
                    let pwhash = await Utility.createHash(password)
                    let customer = await db.models.customers.create({
                        firstName: firstName, lastName: lastName, firstNameKana: firstNameKana, lastNameKana: lastNameKana,
                        email: oldToken.target, telephone: telephone, pwhash: pwhash,
                        zipPostal: zipPostal, prefecture: prefecture, city: city, address: address,
                        gender: gender, dateOfBirth: dateOfBirth,
                        q2inspectionCount: q2inspectionCount, q3inspectionPurpose: q3inspectionPurpose, q4isVaccinated: q4isVaccinated, q5unvaccinatedReason: q5unvaccinatedReason,
                        consent1: consent1, consent2: consent2
                    }, { transaction: transaction })
                    await oldToken.destroy({ transaction: transaction })
                    //LOGIN
                    req.session.user = { customerId: customer.customerId, displayName: `${customer.lastName} ${customer.firstName}`, expires: SESSION_EXPIRE_TIME }
                    res.cookie(process.env.SESS_NAME as string, { maxAge: (SESSION_EXPIRE_TIME), sameSite: 'lax' })
                    await transaction.commit()
                    return res.sendStatus(RESPONSE_SUCCESS)
                }
            }
        } catch (e: any) {
            if (transaction != null) { await transaction.rollback() }
            if (e instanceof DataConflictError) {
                res.sendStatus(BAD_REQUEST)
            } else {
                errLog(`CustomerSignup ${JSON.stringify(e)} ${e.toString()}`, 'db')
                res.sendStatus(SYSTEM_ERROR)
            }
        }
    }
    static async CustomerLogin(req: Request, res: Response) {
        try {
            if (!(req.body.username && req.body.password)) {
                return res.sendStatus(PERMISSION_ERROR)
            }
            let customer = await db.models.customers.findOne({ where: { email: req.body.username, pwhash: { [Op.not]: null } } })
            if (customer == null) {
                return res.sendStatus(PERMISSION_ERROR)
            }
            let isMatch = await Utility.comparePassword(req.body.password, customer.pwhash!)
            if (isMatch) {
                req.session.user = { customerId: customer.customerId, displayName: `${customer.lastName} ${customer.firstName}`, expires: SESSION_EXPIRE_TIME }
                res.cookie(process.env.SESS_NAME as string, { maxAge: (SESSION_EXPIRE_TIME), sameSite: 'lax' })
                req.brute!.reset!(function () {
                    res.status(RESPONSE_SUCCESS).send({ customerId: customer!.customerId, role: 'customer' })
                })
            } else {
                return res.sendStatus(PERMISSION_ERROR)
            }
        } catch (e: any) {
            console.warn(e);
            errLog(`CustomerLogin ${JSON.stringify(e)}`, 'db')
            res.sendStatus(SYSTEM_ERROR)
        }
    }

    static async Logout(req: Request, res: Response) {
        try {
            let role: { managerId?: number; customerId?: number; role: 'manager' | 'customer' } | null = null
            if (req.session.user?.managerId) {
                role = { managerId: req.session.user.managerId, role: 'manager' }
            } else if (req.session.user?.customerId) {
                role = { customerId: req.session.user.customerId, role: 'customer' }
            }
            req.session?.destroy(err => {
                if (err) {
                    console.warn(err)
                    res.sendStatus(SYSTEM_ERROR)
                }
                else {
                    res.clearCookie(process.env.SESS_NAME as string)
                    res.status(RESPONSE_SUCCESS).send(role)
                }
            })
        } catch (e: any) {
            res.send(SYSTEM_ERROR)
        }
    }

    //ADMIN SIDE
    static async MasterLogin(req: Request, res: Response) {
        try {
            let manager = await db.models.managers.findOne({
                where: { username: req.body.username }
            })
            if (manager == null) {
                return res.sendStatus(PERMISSION_ERROR)
            } else {
                let isMatch = await Utility.comparePassword(req.body.password, manager.pwhash)
                if (!isMatch) {
                    return res.sendStatus(PERMISSION_ERROR)
                }
                req.session.user = {
                    managerId: manager.managerId,
                    expires: SESSION_EXPIRE_TIME
                }
                res.cookie(process.env.SESS_NAME as string, { maxAge: (SESSION_EXPIRE_TIME), sameSite: 'lax' })
                req.brute!.reset!(function () {
                    res.status(RESPONSE_SUCCESS).send({ managerId: manager!.managerId, role: 'manager' })
                })
            }
        } catch (e: any) {
            errLog(`MasterLogin ${JSON.stringify(e)}`, 'db')
            return res.sendStatus(SYSTEM_ERROR)
        }
    }
}