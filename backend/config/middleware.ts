import { NextFunction, Request, Response } from "express"
import { SESSION_ERROR, SYSTEM_ERROR } from "./constants"

const checkSession = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.session.user == null) throw { msg: 'session does not exist' }
        next()
    } catch (e: any) {
        if (e.msg) { res.sendStatus(SESSION_ERROR) }
        else res.sendStatus(SYSTEM_ERROR)
    }
}

const checkMaster = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.session.user?.managerId) {
            res.locals.managerId = req.session.user.managerId
            next()
        } else {
            return res.sendStatus(SESSION_ERROR)
        }
    } catch (e: any) {
        return res.sendStatus(SYSTEM_ERROR)
    }
}
const checkCustomer = (req: Request, res: Response, next: NextFunction) => {
    try {
        if (req.session.user?.customerId) {
            res.locals.customerId = req.session.user.customerId
            next()
        } else {
            return res.sendStatus(SESSION_ERROR)
        }
    } catch (e: any) {
        return res.sendStatus(SYSTEM_ERROR)
    }
}

export { checkSession, checkMaster, checkCustomer }