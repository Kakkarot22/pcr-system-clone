import { Model, Optional, HasManyGetAssociationsMixin, WhereOptions, Sequelize, DataTypes, HasManyAddAssociationMixin, Association, Op } from "sequelize";
import { customerSearchParams } from "../config/searchParams";
import { Occurrence } from "./occurrence.model";
import { Registration } from "./registration.model";
import { Token } from "./token.model";
// import { Inquiry } from "./inquiry.model";
export interface CustomerAttributes {
    customerId?: number
    firstName: string | null
    lastName: string | null
    firstNameKana: string | null
    lastNameKana: string | null
    email: string | null
    telephone: string | null
    zipPostal: string | null
    prefecture: string | null
    city: string | null
    address: string | null
    pwhash: string | null
    isManual: boolean
    gender: 'male' | 'female' | null
    dateOfBirth: Date | null
    q2inspectionCount: number | null
    q3inspectionPurpose: number | null
    q4isVaccinated: number | null
    q5unvaccinatedReason: number | null
    consent1: boolean
    consent2: boolean
}
export interface CustomerCreationAttributes extends Optional<CustomerAttributes,
    "customerId" | "firstName" | "lastName" | "firstNameKana" | "lastNameKana"
    | "email" | "telephone" | "zipPostal" | "prefecture" | "city" | "address" | "pwhash" | "isManual"
    | "gender" | "dateOfBirth" | "q2inspectionCount" | "q3inspectionPurpose" | "q4isVaccinated" | "q5unvaccinatedReason"> { }
export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> {
    //ATTRIBUTES
    public customerId!: number
    public firstName!: string | null
    public lastName!: string | null
    public firstNameKana!: string | null
    public lastNameKana!: string | null
    public email!: string | null
    public telephone!: string | null
    public zipPostal!: string | null
    public prefecture!: string | null
    public city!: string | null
    public address!: string | null
    public pwhash!: string | null
    public isManual!: boolean
    public gender!: 'male' | 'female' | null
    public dateOfBirth!: Date | null
    public q2inspectionCount!: number | null
    public q3inspectionPurpose!: number | null
    public q4isVaccinated!: number | null
    public q5unvaccinatedReason!: number | null
    public consent1!: boolean
    public consent2!: boolean
    // public q5unvaccinatedOther!: string | null
    //ASSOCIATIONS
    public readonly registrations?: Registration[]
    public readonly Tokens?: Token
    public static associations: {
        registrations: Association<Customer, Registration>
        Token: Association<Customer, Token>
    }
    //TIMESTAMPS
    public readonly updatedAt!: Date
    public readonly createdAt!: Date
    public readonly deletedAt!: Date

    static initClass(sequelize: Sequelize) {
        return Customer.init({
            customerId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            firstName: { type: DataTypes.STRING(32), allowNull: true, defaultValue: null },
            lastName: { type: DataTypes.STRING(32), allowNull: true, defaultValue: null },
            firstNameKana: { type: DataTypes.STRING(32), allowNull: true, defaultValue: null },
            lastNameKana: { type: DataTypes.STRING(32), allowNull: true, defaultValue: null },
            email: { type: DataTypes.STRING(100), allowNull: true },
            telephone: { type: DataTypes.STRING(20), allowNull: true },
            zipPostal: { type: DataTypes.STRING(10), allowNull: true, defaultValue: null },
            prefecture: { type: DataTypes.STRING(10), allowNull: true, defaultValue: null },
            city: { type: DataTypes.STRING(20), allowNull: true, defaultValue: null },
            address: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
            pwhash: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
            isManual: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            gender: { type: DataTypes.STRING(10), allowNull: true },
            dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
            q2inspectionCount: { type: DataTypes.TINYINT, allowNull: true },
            q3inspectionPurpose: { type: DataTypes.TINYINT, allowNull: true },
            q4isVaccinated: { type: DataTypes.TINYINT, allowNull: true },
            q5unvaccinatedReason: { type: DataTypes.TINYINT, allowNull: true },
            consent1: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            consent2: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'customers', modelName: 'Customer', name: { singular: 'Customer', plural: 'customers' } })
    }
    public getBasicInfo() {
        return {
            customerId: this.customerId,
            // displayName: this.displayName,
            fullName: `${this.lastName} ${this.firstName}`,
            telephone: this.telephone,
            email: this.email
        }
    }
}