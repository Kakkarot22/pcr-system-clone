"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = exports.db = void 0;
require("dotenv").config();
const sequelize_1 = require("sequelize");
const manager_model_1 = require("../models/manager.model");
const customer_model_1 = require("./customer.model");
const occurrence_model_1 = require("./occurrence.model");
const occasion_model_1 = require("./occasion.model");
const registration_model_1 = require("./registration.model");
const template_model_1 = require("./template.model");
const systemSetting_model_1 = require("./systemSetting.model");
const token_model_1 = require("./token.model");
const dbConfig = {
    db_host: process.env.DB_HOSTNAME,
    db_user: process.env.DB_USERNAME,
    db_pw: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: undefined
};
const sequelize = new sequelize_1.Sequelize({
    database: dbConfig.DB,
    username: dbConfig.db_user,
    password: dbConfig.db_pw,
    host: dbConfig.db_host,
    dialect: dbConfig.dialect,
    port: dbConfig.port,
    timezone: '+09:00',
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    },
    logging: dbConfig.logging
});
exports.sequelize = sequelize;
systemSetting_model_1.SystemSetting.initClass(sequelize);
customer_model_1.Customer.initClass(sequelize);
occasion_model_1.Occasion.initClass(sequelize);
occurrence_model_1.Occurrence.initClass(sequelize);
registration_model_1.Registration.initClass(sequelize);
template_model_1.Template.initClass(sequelize);
manager_model_1.Manager.initClass(sequelize);
token_model_1.Token.initClass(sequelize);
occasion_model_1.Occasion.hasMany(occurrence_model_1.Occurrence, { foreignKey: 'occasionId' });
occurrence_model_1.Occurrence.belongsTo(occasion_model_1.Occasion, { foreignKey: 'occasionId' });
customer_model_1.Customer.hasMany(registration_model_1.Registration, { foreignKey: 'customerId' });
registration_model_1.Registration.belongsTo(customer_model_1.Customer, { foreignKey: 'customerId' });
token_model_1.Token.belongsTo(customer_model_1.Customer, { foreignKey: 'customerId', foreignKeyConstraint: false });
customer_model_1.Customer.hasOne(token_model_1.Token, { foreignKey: 'customerId' });
occurrence_model_1.Occurrence.hasMany(registration_model_1.Registration, { foreignKey: 'occurrenceId' });
registration_model_1.Registration.belongsTo(occurrence_model_1.Occurrence, { foreignKey: 'occurrenceId' });
const db = {
    sequelize: sequelize,
    models: {
        customers: customer_model_1.Customer,
        managers: manager_model_1.Manager,
        occasions: occasion_model_1.Occasion,
        occurrences: occurrence_model_1.Occurrence,
        registrations: registration_model_1.Registration,
        templates: template_model_1.Template,
        tokens: token_model_1.Token,
        systemSettings: systemSetting_model_1.SystemSetting
    }
};
exports.db = db;
