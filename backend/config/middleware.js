"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCustomer = exports.checkMaster = exports.checkSession = void 0;
const constants_1 = require("./constants");
const checkSession = (req, res, next) => {
    try {
        if (req.session.user == null)
            throw { msg: 'session does not exist' };
        next();
    }
    catch (e) {
        if (e.msg) {
            res.sendStatus(constants_1.SESSION_ERROR);
        }
        else
            res.sendStatus(constants_1.SYSTEM_ERROR);
    }
};
exports.checkSession = checkSession;
const checkMaster = (req, res, next) => {
    try {
        if (req.session.user?.managerId) {
            res.locals.managerId = req.session.user.managerId;
            next();
        }
        else {
            return res.sendStatus(constants_1.SESSION_ERROR);
        }
    }
    catch (e) {
        return res.sendStatus(constants_1.SYSTEM_ERROR);
    }
};
exports.checkMaster = checkMaster;
const checkCustomer = (req, res, next) => {
    try {
        if (req.session.user?.customerId) {
            res.locals.customerId = req.session.user.customerId;
            next();
        }
        else {
            return res.sendStatus(constants_1.SESSION_ERROR);
        }
    }
    catch (e) {
        return res.sendStatus(constants_1.SYSTEM_ERROR);
    }
};
exports.checkCustomer = checkCustomer;
