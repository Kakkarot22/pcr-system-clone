"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
const models_1 = require("../models");
const utility_1 = require("../utility");
const sequelize_1 = require("sequelize");
const constants_1 = require("../config/constants");
class TemplateController {
    static async create(req, res) {
        try {
            const { name, contents, description } = req.body;
            let template = await models_1.db.models.templates.create({ name: name, contents: contents, description: description });
            res.send(template);
        }
        catch (e) {
            (0, utility_1.errLog)(`create template ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async browse(req, res) {
        try {
            let searchParams = {};
            if (req.query.name)
                searchParams.name = { [sequelize_1.Op.like]: `%${req.query.name}%` };
            if (req.query.contents)
                searchParams.contents = { [sequelize_1.Op.like]: `%${req.query.contents}%` };
            if (req.query.description)
                searchParams.description = { [sequelize_1.Op.like]: `%${req.query.description}%` };
            let templateData;
            if (req.query.asArray)
                templateData = await models_1.db.models.templates.findAll({ where: searchParams });
            else
                templateData = await models_1.db.models.templates.findOne({ where: searchParams });
            res.send(templateData);
        }
        catch (e) {
            (0, utility_1.errLog)(`browse templates ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async find(req, res) {
        try {
            let occasionId = parseInt(req.params.occasionId);
            res.send(await models_1.db.models.templates.findByPk(occasionId));
        }
        catch (e) {
            (0, utility_1.errLog)(`find template ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async update(req, res) {
        let occasionId = parseInt(req.params.occasionId);
        try {
            if (occasionId == null) {
                throw `invalid parameter occasion ${occasionId}`;
            }
            await models_1.db.models.templates.updateTemplate(occasionId, req.body);
            res.send(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`update template ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
    static async delete(req, res) {
        try {
            let occasionId = parseInt(req.params.occasionId);
            await models_1.db.models.templates.deleteTemplate(occasionId);
            res.sendStatus(constants_1.RESPONSE_SUCCESS);
        }
        catch (e) {
            (0, utility_1.errLog)(`delete template ${req.params.occasionId}: ${e.toString()}`, "db");
            res.sendStatus(constants_1.SYSTEM_ERROR);
        }
    }
}
exports.TemplateController = TemplateController;
