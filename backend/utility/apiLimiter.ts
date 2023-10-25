import { Request, Response, NextFunction } from "express";
import { errLog } from ".";
import { db } from "../models";

import ExpressBrute = require('express-brute');
import { DataTypes } from "sequelize";
var ExpressBruteStore = require('express-brute-store-sequelize')

const bruteStoreOptions = {
    tableName: 'bruteStore', // this is a default name
    fields: { key: DataTypes.STRING }, // you can merge model fields
    modelOptions: { timestamps: false } // you can merge model options
};
let store = null
try {
    store = new ExpressBruteStore(db.sequelize, bruteStoreOptions)
} catch (error: any) {
    errLog(`failed to create express brute store. error: ${error.toString()}`)
}

var failCallback = function (req: Request, res: Response, next: NextFunction, nextValidRequestDate: any) {
    res.sendStatus(429); // brute force protection triggered, send them back to the login page
};
var handleStoreError = function (error: Error) {
    errLog(`handleStoreError ${error.message}`, "db")
    // cause node to exit, hopefully restarting the process fixes the problem
    throw {
        message: error.message,
        parent: error.stack
    };
}
const tokenBruteOptions = {
    freeRetries: 4,
    minWait: 10 * 1000,//25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    maxWait: 60 * 60 * 1000,// 1 day 1 hour (should never reach this wait time)
    lifetime: 60,// 1 day (seconds not milliseconds)
    attachResetToRequest: true,
    refreshTimeoutOnRequest: false,
    failCallback: failCallback,
    handleStoreError: handleStoreError
}
const loginBruteOptions = {
    freeRetries: 4,
    minWait: 10 * 1000,//25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    maxWait: 60 * 60 * 1000,// 1 day 1 hour (should never reach this wait time)
    lifetime: 60,// 1 day (seconds not milliseconds)
    attachResetToRequest: true,
    refreshTimeoutOnRequest: false,
    failCallback: failCallback,
    handleStoreError: handleStoreError
}
var tokenBruteforce = new ExpressBrute(store, tokenBruteOptions);
var loginBruteforce = new ExpressBrute(store, loginBruteOptions);
export { tokenBruteforce, loginBruteforce }