"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const middleware_1 = require("../config/middleware");
const customer_routes_1 = require("./customer.routes");
const master_routes_1 = require("./master.routes");
const constants_1 = require("../config/constants");
const system_controller_1 = require("../controllers/system.controller");
const entry_controller_1 = require("../controllers/entry.controller");
const apiLimiter_1 = require("../utility/apiLimiter");
const router = (0, express_1.Router)();
exports.router = router;
router.use('/u', middleware_1.checkCustomer, customer_routes_1.router);
router.post('/signup', entry_controller_1.EntryController.CustomerSignup);
router.post('/reset', entry_controller_1.EntryController.CustomerResetPassword);
router.post('/token', entry_controller_1.EntryController.ConsumeToken);
router.post('/email', apiLimiter_1.tokenBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username); } }), (req, res, next) => { res.locals.tokenType = 'new'; next(); }, entry_controller_1.EntryController.RequestToken);
router.post('/forgot', apiLimiter_1.tokenBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username); } }), (req, res, next) => { res.locals.tokenType = 'forgot'; next(); }, entry_controller_1.EntryController.RequestToken);
router.post('/auth', apiLimiter_1.loginBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username); } }), entry_controller_1.EntryController.MasterLogin);
router.post('/login', apiLimiter_1.loginBruteforce.getMiddleware({ key: function (req, res, next) { next(req.body.username); } }), entry_controller_1.EntryController.CustomerLogin);
router.use('/logout', entry_controller_1.EntryController.Logout);
router.use('/master', middleware_1.checkMaster, master_routes_1.router);
router.get('/auth', (req, res) => {
    if (req.session.user?.managerId) {
        res.send({ role: 'manager' });
    }
    else if (req.session.user?.customerId) {
        res.send({ role: 'customer' });
    }
    else {
        res.sendStatus(constants_1.SESSION_ERROR);
    }
});
router.get('/sess', (req, res) => {
    if (req.session.user?.managerId) {
        res.send({ managerId: req.session.user.managerId, role: 'manager' });
    }
    else if (req.session.user?.customerId) {
        res.send({ customerId: req.session.user.customerId, role: 'customer' });
    }
    else {
        res.sendStatus(constants_1.SESSION_ERROR);
    }
});
router.get('/settings', system_controller_1.SystemSettingController.getPublicSettings);
