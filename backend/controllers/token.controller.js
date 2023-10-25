"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenController = void 0;
const models_1 = require("../models");
const utility_1 = require("../utility");
const sequelize_1 = require("sequelize");
class TokenController {
    static async destroyExpired() {
        try {
            let expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() - 3);
            await models_1.db.models.tokens.destroy({ where: { createdAt: { [sequelize_1.Op.lte]: expiresAt } } });
        }
        catch (e) {
            (0, utility_1.errLog)(`destroy expired token ${e.toString()}`, "db");
        }
    }
}
exports.TokenController = TokenController;
