"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Token = void 0;
const sequelize_1 = require("sequelize");
class Token extends sequelize_1.Model {
    static initClass(sequelize) {
        Token.init({
            tokenId: { type: sequelize_1.DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: sequelize_1.DataTypes.UUIDV4 },
            customerId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, defaultValue: null },
            type: { type: sequelize_1.DataTypes.STRING(30), allowNull: false },
            target: { type: sequelize_1.DataTypes.STRING(64), allowNull: false },
        }, { sequelize: sequelize, tableName: 'tokens', name: { singular: 'Token', plural: 'tokens' }, timestamps: true });
    }
}
exports.Token = Token;
