"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const constants_1 = require("../config/constants");
const customer_controller_1 = require("../controllers/customer.controller");
const occasion_controller_1 = require("../controllers/occasion.controller");
const utility_1 = require("../utility");
const router = (0, express_1.Router)();
exports.router = router;
router.get('/', async (req, res) => {
    let customerId = res.locals.customerId;
    try {
        let customer = await customer_controller_1.CustomerController.getSelf(customerId);
        res.send(customer);
    }
    catch (e) {
        (0, utility_1.errLog)(`getCustomerAPI ${e.toString()}`, "api");
    }
});
router.put('/personal', async (req, res) => {
    let customerId = res.locals.customerId;
    try {
        let updatedC = await customer_controller_1.CustomerController.updateSelf(customerId, req.body);
        res.send(updatedC);
    }
    catch (e) {
        (0, utility_1.errLog)(`newRegistration ${e.toString()}`, "api");
        res.sendStatus(constants_1.SYSTEM_ERROR);
    }
});
router.get('/registrations', async (req, res) => {
    let customerId = res.locals.customerId;
    try {
        if (!customerId) {
            throw `invalid parameters. customer: ${customerId}`;
        }
        let registrations = await customer_controller_1.CustomerController.myRegistrations(customerId);
        res.send(registrations);
    }
    catch (e) {
        (0, utility_1.errLog)(`my registrations ${e.toString()}`, "api");
        res.sendStatus(constants_1.SYSTEM_ERROR);
    }
});
router.get('/events/overview', occasion_controller_1.OccasionController.overview);
router.get('/events/:occasionId/days', occasion_controller_1.OccasionController.getUniqueDays);
router.get('/events/:occasionId/times', occasion_controller_1.OccasionController.getUniqueTimes);
router.get('/events/:occasionId/details', occasion_controller_1.OccasionController.getEventProperties);
router.get('/events/:occasionId', occasion_controller_1.OccasionController.getEventScheduleSimple);
router.post('/events', async (req, res) => {
    let customerId = res.locals.customerId;
    try {
        let newReg = await customer_controller_1.CustomerController.registerForEvent(customerId, req.body);
        res.send(newReg);
    }
    catch (e) {
        if (e.errCode && e.msg) {
            (0, utility_1.errLog)(`register event ${e.msg}`, "db");
            res.sendStatus(e.errCode);
        }
        else {
            (0, utility_1.errLog)(`register event ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
});
router.delete('/events', async (req, res) => {
    let customerId = res.locals.customerId;
    try {
        await customer_controller_1.CustomerController.cancelRegistration(customerId, req.body);
        res.sendStatus(constants_1.RESPONSE_SUCCESS);
    }
    catch (e) {
        if (e.errCode && e.msg) {
            (0, utility_1.errLog)(`cancel registration ${e.msg}`, "db");
            res.sendStatus(constants_1.NOT_ACCEPTABLE);
        }
        else {
            (0, utility_1.errLog)(`cancel registration ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
});
