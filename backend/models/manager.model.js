"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Manager = void 0;
const sequelize_1 = require("sequelize");
const utility_1 = require("../utility");
class Manager extends sequelize_1.Model {
    static initClass(sequelize) {
        return Manager.init({
            managerId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            username: { type: sequelize_1.DataTypes.STRING(30), allowNull: false },
            pwhash: { type: sequelize_1.DataTypes.STRING(128), allowNull: false },
            recoveryMail: { type: sequelize_1.DataTypes.STRING(50), allowNull: true },
            isActivated: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
        }, { sequelize: sequelize, timestamps: false, tableName: 'managers', modelName: 'Manager', name: { singular: 'Manager', plural: 'managers' } });
    }
    static async createManager(params) {
        try {
            let pwhash = await utility_1.Utility.createHash(params.pwhash);
            await this.create({ username: params.username, pwhash: pwhash, recoveryMail: params.recoveryMail, isActivated: false });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static async getManager(id) {
        try {
            let manager = await this.findOne({ where: { managerId: id } });
            return manager;
        }
        catch (e) {
            return null;
        }
    }
    static async getManagers() {
        try {
            return await this.findAll();
        }
        catch (e) {
            return null;
        }
    }
    static async updateManager(id, params) {
        try {
            return await this.update(params, {
                where: { managerId: id }
            });
        }
        catch (e) {
            return [0];
        }
    }
    static async deleteManager(id) {
        try {
            let isDestroyed = await this.destroy({ where: { managerId: id } });
            return isDestroyed > 0;
        }
        catch (e) {
            return null;
        }
    }
    static async deleteAllManagers() {
        try {
            let isAllDestroyed = await this.destroy({ where: {} });
            return isAllDestroyed > 0;
        }
        catch (e) {
            return null;
        }
    }
}
exports.Manager = Manager;
