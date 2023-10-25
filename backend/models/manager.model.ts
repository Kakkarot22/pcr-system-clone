import { Model, Optional, HasManyGetAssociationsMixin, WhereOptions, Sequelize, DataTypes, HasManyAddAssociationMixin, Association } from "sequelize";
import { Utility } from "../utility";
export interface ManagerAttributes {
    managerId?: number
    username: string
    pwhash?: string
    recoveryMail?: string
    isActivated?: boolean
}
export class Manager extends Model<ManagerAttributes, ManagerAttributes> {
    //ATTRIBUTES
    public managerId!: number
    public username!: string
    public pwhash!: string
    public recoveryMail!: string
    public isActivated!: boolean

    static initClass(sequelize: Sequelize) {
        return Manager.init({
            managerId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            username: { type: DataTypes.STRING(30), allowNull: false },
            pwhash: { type: DataTypes.STRING(128), allowNull: false },
            recoveryMail: { type: DataTypes.STRING(50), allowNull: true },
            isActivated: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
        }, { sequelize: sequelize, timestamps: false, tableName: 'managers', modelName: 'Manager', name: { singular: 'Manager', plural: 'managers' } })
    }
    static async createManager(params: ManagerAttributes): Promise<boolean> {
        try {
            let pwhash = await Utility.createHash(params.pwhash!)
            await this.create({ username: params.username, pwhash: pwhash, recoveryMail: params.recoveryMail, isActivated: false })
            return true
        } catch (e: any) {
            return false
        }
    }
    static async getManager(id: number) {
        try {
            let manager = await this.findOne({ where: { managerId: id } })
            return manager
        } catch (e: any) {
            return null
        }
    }
    static async getManagers() {
        try {
            return await this.findAll()
        } catch (e: any) {
            return null
        }
    }
    static async updateManager(id: number, params: any) {
        try {
            return await this.update(params, {
                where: { managerId: id }
            })
        } catch (e: any) {
            return [0]
        }
    }
    static async deleteManager(id: number) {
        try {
            let isDestroyed = await this.destroy({ where: { managerId: id } })
            return isDestroyed > 0
        } catch (e: any) {
            return null
        }
    }
    static async deleteAllManagers() {
        try {
            let isAllDestroyed = await this.destroy({ where: {} })
            return isAllDestroyed > 0
        } catch (e: any) {
            return null
        }
    }
}