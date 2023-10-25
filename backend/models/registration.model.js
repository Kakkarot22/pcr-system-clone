"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registration = void 0;
const sequelize_1 = require("sequelize");
class Registration extends sequelize_1.Model {
    static initClass(sequelize) {
        return Registration.init({
            registrationId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            customerId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            occurrenceId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            expected: { type: sequelize_1.DataTypes.TINYINT, allowNull: false },
            attended: { type: sequelize_1.DataTypes.SMALLINT, allowNull: true, defaultValue: 0 },
            isNotified: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            isNotified1: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            cancelledAt: { type: sequelize_1.DataTypes.DATE, allowNull: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'registrations', modelName: 'Registration', name: { singular: 'Registration', plural: 'registrations' } });
    }
}
exports.Registration = Registration;
