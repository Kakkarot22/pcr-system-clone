require("dotenv").config();
import { Sequelize } from "sequelize";
import { Manager } from "../models/manager.model";
import { Customer } from "./customer.model";
import { Occurrence } from "./occurrence.model";
import { Occasion } from "./occasion.model";
import { Registration } from "./registration.model";
import { Template } from "./template.model";
import { SystemSetting } from "./systemSetting.model";
import { Token } from "./token.model";
const dbConfig = {
    db_host: process.env.DB_HOSTNAME as string,
    db_user: process.env.DB_USERNAME as string,
    db_pw: process.env.DB_PASSWORD,
    DB: process.env.DB_NAME as string,
    dialect: process.env.DB_DIALECT as string,
    port: process.env.DB_PORT as undefined,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: undefined
};
const sequelize = new Sequelize({
    database: dbConfig.DB,
    username: dbConfig.db_user,
    password: dbConfig.db_pw,
    host: dbConfig.db_host,
    dialect: dbConfig.dialect as "mysql" | "postgres" | "sqlite" | "mariadb" | undefined,
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
SystemSetting.initClass(sequelize)
Customer.initClass(sequelize)
Occasion.initClass(sequelize)
Occurrence.initClass(sequelize)
Registration.initClass(sequelize)
Template.initClass(sequelize)
Manager.initClass(sequelize)
Token.initClass(sequelize)

//RELATIONS
Occasion.hasMany(Occurrence, { foreignKey: 'occasionId' })
Occurrence.belongsTo(Occasion, { foreignKey: 'occasionId' })

Customer.hasMany(Registration, { foreignKey: 'customerId' })
Registration.belongsTo(Customer, { foreignKey: 'customerId' })

Token.belongsTo(Customer, { foreignKey: 'customerId', foreignKeyConstraint: false })
Customer.hasOne(Token, { foreignKey: 'customerId' })

Occurrence.hasMany(Registration, { foreignKey: 'occurrenceId' })
Registration.belongsTo(Occurrence, { foreignKey: 'occurrenceId' })

const db = {
    sequelize: sequelize,
    models: {
        customers: Customer,
        managers: Manager,
        occasions: Occasion,
        occurrences: Occurrence,
        registrations: Registration,
        templates: Template,
        tokens: Token,

        systemSettings: SystemSetting
    }
};
export { db, sequelize }