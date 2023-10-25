import { db } from "../models";
import { Request, Response } from "express";
import { errLog } from "../utility";
import { templateSearchParams } from "../config/searchParams";
import { Op } from "sequelize";
import { RESPONSE_SUCCESS, SYSTEM_ERROR } from "../config/constants";
export class TemplateController {
    static async create(req: Request, res: Response) {
        try {
            const { name, contents, description } = req.body
            let template = await db.models.templates.create({ name: name, contents: contents, description: description })
            res.send(template)
        } catch (e: any) {
            errLog(`create template ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async browse(req: Request, res: Response) {
        try {
            let searchParams: any = {}
            if (req.query.name) searchParams.name = { [Op.like]: `%${req.query.name}%` }
            if (req.query.contents) searchParams.contents = { [Op.like]: `%${req.query.contents}%` }
            if (req.query.description) searchParams.description = { [Op.like]: `%${req.query.description}%` }
            let templateData
            if (req.query.asArray) templateData = await db.models.templates.findAll({ where: searchParams })
            else templateData = await db.models.templates.findOne({ where: searchParams })
            res.send(templateData)
        } catch (e: any) {
            errLog(`browse templates ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async find(req: Request, res: Response) {
        try {
            let occasionId = parseInt(req.params.occasionId)
            res.send(await db.models.templates.findByPk(occasionId))
        } catch (e: any) {
            errLog(`find template ${req.params.occasionId}: ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async update(req: Request, res: Response) {
        let occasionId = parseInt(req.params.occasionId)
        try {
            if (occasionId == null) {
                throw `invalid parameter occasion ${occasionId}`
            }
            await db.models.templates.updateTemplate(occasionId, req.body)
            res.send(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`update template ${req.params.occasionId}: ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
    static async delete(req: Request, res: Response) {
        try {
            let occasionId = parseInt(req.params.occasionId)
            await db.models.templates.deleteTemplate(occasionId)
            res.sendStatus(RESPONSE_SUCCESS)
        } catch (e: any) {
            errLog(`delete template ${req.params.occasionId}: ${e.toString()}`, "db")
            res.sendStatus(SYSTEM_ERROR)
        }
    }
}