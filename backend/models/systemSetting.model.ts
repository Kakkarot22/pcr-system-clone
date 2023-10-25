import { Model, Optional, HasManyGetAssociationsMixin, WhereOptions, Sequelize, DataTypes, HasManyAddAssociationMixin, Association, WhereAttributeHash, Op } from "sequelize";
interface SystemSettingAttributes {
    name?: string
    label: string
    valueFlag?: boolean
    valueString?: string
    valueNumber?: number
    isPublic?: boolean
}
interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, "valueFlag" | "valueString" | "valueNumber" | "isPublic"> { }
class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes> {
    //ATTRIBUTES
    public name!: string
    public label!: string
    public valueFlag!: boolean
    public valueString!: string
    public valueNumber!: number
    public isPublic!: boolean
    //ASSOCIATIONS
    //METHODS
    public static async findSettings(key: string) {
        return await SystemSetting.findOne({ where: { name: key } })
    }
    public static async getSettings() {
        return await SystemSetting.findAll()
    }
    public static async findPublicSettings() {
        return await SystemSetting.findAll({ where: { isPublic: true } }).then(publicSettings => {
            let result: any = {}
            publicSettings.forEach(ps => {
                let key = ps.name
                result[key] = {
                    label: ps.label,
                    valueFlag: ps.valueFlag,
                    valueString: ps.valueString,
                    valueNumber: ps.valueNumber
                }
            });
            return result
        })
    }
    public static async createSettings(params: SystemSettingAttributes) {
        return await SystemSetting.create(params)
    }
    public static async deleteSettings(key: string) {
        return (await SystemSetting.destroy({ where: { name: key } })) > 0
    }
    //FAVICON
    public static async findFavicon() {
        return await this.findOne({ where: { name: 'favicon' }, attributes: ['valueString'] })
    }
    //LOGO
    public static async findLogo() {
        return await this.findOne({ where: { name: 'logo' }, attributes: ['valueString'] })
    }
    public static initClass(sequelize: Sequelize) {
        this.init({
            name: { type: DataTypes.STRING(30), primaryKey: true, allowNull: false },
            label: { type: DataTypes.STRING(30), allowNull: false },
            valueFlag: { type: DataTypes.STRING(30), allowNull: true, defaultValue: null },
            valueString: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
            valueNumber: { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
            isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
        }, { sequelize: sequelize, tableName: 'systemSettings', name: { singular: 'SystemSetting', plural: 'systemSettings' }, timestamps: false })
    }
}
export { SystemSetting, SystemSettingAttributes }