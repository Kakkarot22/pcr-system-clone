import { Request, Response } from "express";
import * as fs from "fs";
import { io } from "../../server";
import { PERMISSION_ERROR, RESPONSE_SUCCESS, SYSTEM_ERROR } from "../config/constants";
import { db } from "../models/index";
import { errLog, Utility } from "../utility";
class SystemSettingController {
    static async getSystemSettings(req: Request, res: Response) {
        try {
            let settings = await db.models.systemSettings.getSettings()
            res.send(settings)
        } catch (e: any) {
            errLog(`get system settings. ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async getSystemSetting(req: Request, res: Response) {
        try {
            let key = req.params.key
            let setting = await db.models.systemSettings.findSettings(key)
            res.send(setting)
        } catch (e: any) {
            errLog(`get system settings. ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async getPublicSettings(req: Request, res: Response) {
        try {
            let sysSettings = await db.models.systemSettings.findPublicSettings()
            res.send(sysSettings)
        } catch (e: any) {
            errLog(`get public system settings. ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async setSystemSettings(req: Request, res: Response) {
        try {
            let key = req.params.key
            let { label, valueFlag, valueString, valueNumber, isPublic } = req.body as { label: string, valueFlag?: boolean, valueString?: string, valueNumber?: number, isPublic?: boolean }
            let setting = await db.models.systemSettings.findByPk(key)
            let isCreated = false
            if (setting == null) {
                setting = await db.models.systemSettings.create({ name: key, label: label, valueFlag: valueFlag, valueString: valueString, valueNumber: valueNumber, isPublic: isPublic })
                isCreated = true
            } else {
                setting.set({ label: label, valueFlag: valueFlag, valueString: valueString, valueNumber: valueNumber, isPublic: isPublic })
                if (setting.changed()) { setting = await setting.save() }
            }
            if (isCreated) { io.emit('newSystemSetting', { key: key }) }
            else { io.emit('updateSystemSetting', { key: key }) }
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`set system settings. ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async deleteSettings(req: Request, res: Response) {
        try {
            let key = req.params.key
            await db.models.systemSettings.deleteSettings(key)
            io.emit('deleteSystemSetting', { systemsettingId: key })
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`set system settings. ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
}
export { SystemSettingController }