import { db } from "../models";
import { Request, Response } from "express";
import { errLog } from "../utility";
import { Op } from "sequelize";
import { RESPONSE_SUCCESS, SYSTEM_ERROR } from "../config/constants";
export class TokenController {
    static async destroyExpired() {
        try {
            let expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() - 3)
            await db.models.tokens.destroy({ where: { createdAt: { [Op.lte]: expiresAt } } })
        } catch (e: any) {
            errLog(`destroy expired token ${e.toString()}`, "db")
        }
    }
}