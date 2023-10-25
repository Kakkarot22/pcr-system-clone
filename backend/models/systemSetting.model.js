"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSetting = void 0;
const sequelize_1 = require("sequelize");
class SystemSetting extends sequelize_1.Model {
    static async findSettings(key) {
        return await SystemSetting.findOne({ where: { name: key } });
    }
    static async getSettings() {
        return await SystemSetting.findAll();
    }
    static async findPublicSettings() {
        return await SystemSetting.findAll({ where: { isPublic: true } }).then(publicSettings => {
            let result = {};
            publicSettings.forEach(ps => {
                let key = ps.name;
                result[key] = {
                    label: ps.label,
                    valueFlag: ps.valueFlag,
                    valueString: ps.valueString,
                    valueNumber: ps.valueNumber
                };
            });
            return result;
        });
    }
    static async createSettings(params) {
        return await SystemSetting.create(params);
    }
    static async deleteSettings(key) {
        return (await SystemSetting.destroy({ where: { name: key } })) > 0;
    }
    static async findFavicon() {
        return await this.findOne({ where: { name: 'favicon' }, attributes: ['valueString'] });
    }
    static async findLogo() {
        return await this.findOne({ where: { name: 'logo' }, attributes: ['valueString'] });
    }
    static initClass(sequelize) {
        this.init({
            name: { type: sequelize_1.DataTypes.STRING(30), primaryKey: true, allowNull: false },
            label: { type: sequelize_1.DataTypes.STRING(30), allowNull: false },
            valueFlag: { type: sequelize_1.DataTypes.STRING(30), allowNull: true, defaultValue: null },
            valueString: { type: sequelize_1.DataTypes.STRING(500), allowNull: true, defaultValue: null },
            valueNumber: { type: sequelize_1.DataTypes.INTEGER, allowNull: true, defaultValue: null },
            isPublic: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
        }, { sequelize: sequelize, tableName: 'systemSettings', name: { singular: 'SystemSetting', plural: 'systemSettings' }, timestamps: false });
    }
}
exports.SystemSetting = SystemSetting;
