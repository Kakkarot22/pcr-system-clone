import { NextFunction, Request, Response, Router } from "express";
import { checkMaster, checkCustomer, checkSession } from "../config/middleware";
import { router as CustomerRouter } from "./customer.routes";
import { router as MasterRouter } from "./master.routes";
import { RESPONSE_SUCCESS, SESSION_ERROR } from "../config/constants";
import { SystemSettingController } from "../controllers/system.controller";
import { EntryController } from "../controllers/entry.controller";
import { loginBruteforce, tokenBruteforce } from "../utility/apiLimiter";


const router = Router()

router.use('/u', checkCustomer, CustomerRouter)
router.post('/signup', EntryController.CustomerSignup)
router.post('/reset', EntryController.CustomerResetPassword)
router.post('/token', EntryController.ConsumeToken)
router.post('/email',
    tokenBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username) } }),
    (req, res, next) => { res.locals.tokenType = 'new'; next() },
    EntryController.RequestToken)
router.post('/forgot',
    tokenBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username) } }),
    (req, res, next) => { res.locals.tokenType = 'forgot'; next() },
    EntryController.RequestToken)
router.post('/auth',
    loginBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username) } }),
    EntryController.MasterLogin)
router.post('/login',
    loginBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username) } }),
    EntryController.CustomerLogin)
router.use('/logout', EntryController.Logout)
router.use('/master', checkMaster, MasterRouter)

router.get('/auth', (req, res) => {
    if (req.session.user?.managerId) { res.send({ role: 'manager' }) }
    else if (req.session.user?.customerId) { res.send({ role: 'customer' }) }
    else { res.sendStatus(SESSION_ERROR) }
})
router.get('/sess', (req, res) => {
    if (req.session.user?.managerId) { res.send({ managerId: req.session.user.managerId, role: 'manager' }) }
    else if (req.session.user?.customerId) { res.send({ customerId: req.session.user.customerId, role: 'customer' }) }
    else { res.sendStatus(SESSION_ERROR) }
})
router.get('/settings', SystemSettingController.getPublicSettings)

export { router }