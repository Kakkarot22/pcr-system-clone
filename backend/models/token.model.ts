import { Sequelize, Model, Op, DataTypes, Association, WhereAttributeHash, Optional } from "sequelize";
import { Customer } from "./customer.model";
interface tokenStructure {
    tokenId?: string
    customerId: number | null
    type: "forgot" | "reset" | "new" | "register"
    target: string
    createdAt?: Date
}
interface cardCreationAttributes extends Optional<tokenStructure, "tokenId"> { }
class Token extends Model<cardCreationAttributes> implements tokenStructure {
    //ATTRIBUTES
    public tokenId!: string
    public customerId!: number | null
    public type!: "forgot" | "reset" | "new" | "register"
    public target!: string
    //TIMESTAMPS
    public readonly createdAt!: Date
    public readonly updatedAt!: Date
    //ASSOCIATIONS
    public readonly Customer?: Customer
    public static associations: {
        Customer: Association<Customer, Token>
    }
    static initClass(sequelize: Sequelize) {
        Token.init({
            tokenId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
            customerId: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
            type: { type: DataTypes.STRING(30), allowNull: false },
            target: { type: DataTypes.STRING(64), allowNull: false },
        }, { sequelize: sequelize, tableName: 'tokens', name: { singular: 'Token', plural: 'tokens' }, timestamps: true })
    }
}
export { Token }