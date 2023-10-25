"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = void 0;
const sequelize_1 = require("sequelize");
class Template extends sequelize_1.Model {
    static initClass(sequelize) {
        return Template.init({
            templateId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            name: { type: sequelize_1.DataTypes.STRING(100), allowNull: false },
            contents: { type: sequelize_1.DataTypes.STRING(500), allowNull: false },
            description: { type: sequelize_1.DataTypes.STRING(200), allowNull: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: false, tableName: 'templates', modelName: 'Template', name: { singular: 'template', plural: 'templates' } });
    }
    static async createTemplate(params) {
        return this.create({ name: params.name, contents: params.contents, description: params.description });
    }
    static async getTemplate(id) {
        return await this.findOne({ where: { templateId: id } });
    }
    static async getTemplateByName(name) {
        return await this.findOne({ where: { name: name } });
    }
    static async getTemplates() {
        return await this.findAll();
    }
    static async updateTemplate(id, params) {
        let newValues = {};
        if (params.name)
            newValues.name = params.name;
        if (params.contents)
            newValues.contents = params.contents;
        if (params.description)
            newValues.description = params.description;
        return await this.update(newValues, {
            where: { templateId: id }
        });
    }
    static async deleteTemplate(id) {
        let isDestroyed = await this.destroy({ where: { templateId: id } });
        return isDestroyed > 0;
    }
    static async deleteAllTemplates() {
        let isAllDestroyed = await this.destroy({ where: {} });
        return isAllDestroyed > 0;
    }
}
exports.Template = Template;
