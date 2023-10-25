import { Model, Association, Optional, Sequelize, DataTypes } from "sequelize";
import { Occurrence } from "./occurrence.model";
import { Customer } from "./customer.model";
export interface RegistrationAttributes {
    registrationId?: number
    customerId?: number
    occurrenceId: number
    expected: number
    attended?: number
    isNotified?: Date
    isNotified1?: Date
    cancelledAt?: Date
}
export interface RegistrationCreationAttributes extends Optional<RegistrationAttributes, "attended" | "cancelledAt"> { }
class Registration extends Model<RegistrationAttributes, RegistrationCreationAttributes>  {
    public registrationId!: number
    public customerId!: number
    public occurrenceId!: number
    public expected!: number
    public attended!: number
    public isNotified!: Date
    public isNotified1!: Date
    public cancelledAt!: Date
    //TIMESTAMPS
    public createdAt!: Date
    public updatedAt!: Date
    public deletedAt!: Date
    //ASSOCIATION
    public readonly Occurrence?: Occurrence
    public readonly Customer?: Customer
    public static associations: {
        Occurrence: Association<Occurrence, Registration>
        Customer: Association<Customer, Registration>
    }
    static initClass(sequelize: Sequelize) {
        return Registration.init({
            registrationId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            customerId: { type: DataTypes.INTEGER, allowNull: false },
            occurrenceId: { type: DataTypes.INTEGER, allowNull: false },
            expected: { type: DataTypes.TINYINT, allowNull: false },
            attended: { type: DataTypes.SMALLINT, allowNull: true, defaultValue: 0 },
            isNotified: { type: DataTypes.DATE, allowNull: true },
            isNotified1: { type: DataTypes.DATE, allowNull: true },
            cancelledAt: { type: DataTypes.DATE, allowNull: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'registrations', modelName: 'Registration', name: { singular: 'Registration', plural: 'registrations' } })
    }
}
export { Registration }