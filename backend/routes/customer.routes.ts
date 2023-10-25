import { Router } from "express"
import { RESPONSE_SUCCESS, SYSTEM_ERROR, NOT_ACCEPTABLE, CONFLICT_ERROR } from "../config/constants"
import { CustomerController } from "../controllers/customer.controller"
import { OccasionController } from "../controllers/occasion.controller"
import { db } from "../models"
import { errLog } from "../utility"
const router = Router()

router.get('/', async (req, res) => {
    let customerId = res.locals.customerId
    try {
        let customer = await CustomerController.getSelf(customerId)
        res.send(customer)
    } catch (e: any) {
        errLog(`getCustomerAPI ${e.toString()}`, "api")
    }
})
router.put('/personal', async (req, res) => {
    let customerId = res.locals.customerId
    try {
        let updatedC = await CustomerController.updateSelf(customerId, req.body)
        res.send(updatedC)
    } catch (e: any) {
        errLog(`newRegistration ${e.toString()}`, "api")
        res.sendStatus(SYSTEM_ERROR)
    }
})
router.get('/registrations', async (req, res) => {
    let customerId = res.locals.customerId
    try {
        if (!customerId) { throw `invalid parameters. customer: ${customerId}` }
        let registrations = await CustomerController.myRegistrations(customerId)
        res.send(registrations)
    } catch (e: any) {
        errLog(`my registrations ${e.toString()}`, "api")
        res.sendStatus(SYSTEM_ERROR)
    }
})
router.get('/events/overview', OccasionController.overview)
router.get('/events/:occasionId/days', OccasionController.getUniqueDays)
router.get('/events/:occasionId/times', OccasionController.getUniqueTimes)
router.get('/events/:occasionId/details', OccasionController.getEventProperties)
router.get('/events/:occasionId', OccasionController.getEventScheduleSimple)
router.post('/events', async (req, res) => {
    let customerId = res.locals.customerId
    try {
        let newReg = await CustomerController.registerForEvent(customerId, req.body)
        res.send(newReg)
    } catch (e: any) {
        if (e.errCode && e.msg) {
            errLog(`register event ${e.msg}`, "db")
            res.sendStatus(e.errCode)
        } else {
            errLog(`register event ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
})
router.delete('/events', async (req, res) => {
    let customerId = res.locals.customerId
    try {
        await CustomerController.cancelRegistration(customerId, req.body)
        res.sendStatus(RESPONSE_SUCCESS)
    } catch (e: any) {
        if (e.errCode && e.msg) {
            errLog(`cancel registration ${e.msg}`, "db")
            res.sendStatus(NOT_ACCEPTABLE)
        } else {
            errLog(`cancel registration ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
})
export { router }