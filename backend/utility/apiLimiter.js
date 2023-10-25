"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginBruteforce = exports.tokenBruteforce = void 0;
const _1 = require(".");
const models_1 = require("../models");
const ExpressBrute = require("express-brute");
const sequelize_1 = require("sequelize");
var ExpressBruteStore = require('express-brute-store-sequelize');
const bruteStoreOptions = {
    tableName: 'bruteStore',
    fields: { key: sequelize_1.DataTypes.STRING },
    modelOptions: { timestamps: false }
};
let store = null;
try {
    store = new ExpressBruteStore(models_1.db.sequelize, bruteStoreOptions);
}
catch (error) {
    (0, _1.errLog)(`failed to create express brute store. error: ${error.toString()}`);
}
var failCallback = function (req, res, next, nextValidRequestDate) {
    res.sendStatus(429);
};
var handleStoreError = function (error) {
    (0, _1.errLog)(`handleStoreError ${error.message}`, "db");
    throw {
        message: error.message,
        parent: error.stack
    };
};
const tokenBruteOptions = {
    freeRetries: 4,
    minWait: 10 * 1000,
    maxWait: 60 * 60 * 1000,
    lifetime: 60,
    attachResetToRequest: true,
    refreshTimeoutOnRequest: false,
    failCallback: failCallback,
    handleStoreError: handleStoreError
};
const loginBruteOptions = {
    freeRetries: 4,
    minWait: 10 * 1000,
    maxWait: 60 * 60 * 1000,
    lifetime: 60,
    attachResetToRequest: true,
    refreshTimeoutOnRequest: false,
    failCallback: failCallback,
    handleStoreError: handleStoreError
};
var tokenBruteforce = new ExpressBrute(store, tokenBruteOptions);
exports.tokenBruteforce = tokenBruteforce;
var loginBruteforce = new ExpressBrute(store, loginBruteOptions);
exports.loginBruteforce = loginBruteforce;
