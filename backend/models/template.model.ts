import { DataTypes, Model, Optional, Sequelize } from "sequelize";
export interface TemplateAttributes {
    templateId?: number
    name: string
    contents: string
    description?: string
}
export interface TemplateCreationAttributes extends Optional<TemplateAttributes, "description"> { }
export class Template extends Model<TemplateAttributes, TemplateCreationAttributes> {
    //ATTRIBUTES
    public templateId!: number
    public name!: string
    public contents!: string
    public description!: string
    static initClass(sequelize:Sequelize) {
        return Template.init({
            templateId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING(100), allowNull: false },
            contents: { type: DataTypes.STRING(500), allowNull: false },
            description: { type: DataTypes.STRING(200), allowNull: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: false, tableName: 'templates', modelName: 'Template', name: { singular: 'template', plural: 'templates' } })
    }
    static async createTemplate(params: TemplateAttributes) {
        return this.create({ name: params.name, contents: params.contents, description: params.description })
    }
    static async getTemplate(id: number) {
        return await this.findOne({ where: { templateId: id } })
    }
    static async getTemplateByName(name: string) {
        return await this.findOne({ where: { name: name } })
    }
    static async getTemplates() {
        return await this.findAll()
    }
    static async updateTemplate(id: number, params: any) {
        let newValues: any = {}
        if (params.name) newValues.name = params.name
        if (params.contents) newValues.contents = params.contents
        if (params.description) newValues.description = params.description
        return await this.update(newValues, {
            where: { templateId: id }
        })
    }
    static async deleteTemplate(id: number) {
        let isDestroyed = await this.destroy({ where: { templateId: id } })
        return isDestroyed > 0
    }
    static async deleteAllTemplates() {
        let isAllDestroyed = await this.destroy({ where: {} })
        return isAllDestroyed > 0
    }
}