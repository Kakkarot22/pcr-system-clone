"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const sequelize_1 = require("sequelize");
class Customer extends sequelize_1.Model {
    static initClass(sequelize) {
        return Customer.init({
            customerId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            firstName: { type: sequelize_1.DataTypes.STRING(32), allowNull: true, defaultValue: null },
            lastName: { type: sequelize_1.DataTypes.STRING(32), allowNull: true, defaultValue: null },
            firstNameKana: { type: sequelize_1.DataTypes.STRING(32), allowNull: true, defaultValue: null },
            lastNameKana: { type: sequelize_1.DataTypes.STRING(32), allowNull: true, defaultValue: null },
            email: { type: sequelize_1.DataTypes.STRING(100), allowNull: true },
            telephone: { type: sequelize_1.DataTypes.STRING(20), allowNull: true },
            zipPostal: { type: sequelize_1.DataTypes.STRING(10), allowNull: true, defaultValue: null },
            prefecture: { type: sequelize_1.DataTypes.STRING(10), allowNull: true, defaultValue: null },
            city: { type: sequelize_1.DataTypes.STRING(20), allowNull: true, defaultValue: null },
            address: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, defaultValue: null },
            pwhash: { type: sequelize_1.DataTypes.STRING, allowNull: true, defaultValue: null },
            isManual: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            gender: { type: sequelize_1.DataTypes.STRING(10), allowNull: true },
            dateOfBirth: { type: sequelize_1.DataTypes.DATEONLY, allowNull: true },
            q2inspectionCount: { type: sequelize_1.DataTypes.TINYINT, allowNull: true },
            q3inspectionPurpose: { type: sequelize_1.DataTypes.TINYINT, allowNull: true },
            q4isVaccinated: { type: sequelize_1.DataTypes.TINYINT, allowNull: true },
            q5unvaccinatedReason: { type: sequelize_1.DataTypes.TINYINT, allowNull: true },
            consent1: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            consent2: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'customers', modelName: 'Customer', name: { singular: 'Customer', plural: 'customers' } });
    }
    getBasicInfo() {
        return {
            customerId: this.customerId,
            fullName: `${this.lastName} ${this.firstName}`,
            telephone: this.telephone,
            email: this.email
        };
    }
}
exports.Customer = Customer;
