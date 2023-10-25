"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingController = void 0;
const server_1 = require("../../server");
const constants_1 = require("../config/constants");
const index_1 = require("../models/index");
const utility_1 = require("../utility");
class SystemSettingController {
    static async getSystemSettings(req, res) {
        try {
            let settings = await index_1.db.models.systemSettings.getSettings();
            res.send(settings);
        }
        catch (e) {
            (0, utility_1.errLog)(`get system settings. ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getSystemSetting(req, res) {
        try {
            let key = req.params.key;
            let setting = await index_1.db.models.systemSettings.findSettings(key);
            res.send(setting);
        }
        catch (e) {
            (0, utility_1.errLog)(`get system settings. ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async getPublicSettings(req, res) {
        try {
            let sysSettings = await index_1.db.models.systemSettings.findPublicSettings();
            res.send(sysSettings);
        }
        catch (e) {
            (0, utility_1.errLog)(`get public system settings. ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async setSystemSettings(req, res) {
        try {
            let key = req.params.key;
            let { label, valueFlag, valueString, valueNumber, isPublic } = req.body;
            let setting = await index_1.db.models.systemSettings.findByPk(key);
            let isCreated = false;
            if (setting == null) {
                setting = await index_1.db.models.systemSettings.create({ name: key, label: label, valueFlag: valueFlag, valueString: valueString, valueNumber: valueNumber, isPublic: isPublic });
                isCreated = true;
            }
            else {
                setting.set({ label: label, valueFlag: valueFlag, valueString: valueString, valueNumber: valueNumber, isPublic: isPublic });
                if (setting.changed()) {
                    setting = await setting.save();
                }
            }
            if (isCreated) {
                server_1.io.emit('newSystemSetting', { key: key });
            }
            else {
                server_1.io.emit('updateSystemSetting', { key: key });
            }
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`set system settings. ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async deleteSettings(req, res) {
        try {
            let key = req.params.key;
            await index_1.db.models.systemSettings.deleteSettings(key);
            server_1.io.emit('deleteSystemSetting', { systemsettingId: key });
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`set system settings. ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
}
exports.SystemSettingController = SystemSettingController;
