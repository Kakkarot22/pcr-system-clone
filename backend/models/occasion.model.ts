import { Model, Association, Optional, Op, WhereAttributeHash, Sequelize, DataTypes, col, fn, literal, cast } from "sequelize";
import { occasionType } from "../config/constants";
import { OccurrenceAttributes, Occurrence } from "./occurrence.model";
import { Registration } from "./registration.model";
export interface OccasionAttributes {
    occasionId?: number
    type: occasionType
    title: string
    telephone: string
    address: string
    zipPostal: string
    timeCancel?: number | null
    textCancel?: string | null
    canCancel: boolean
    cancelMessage?: string | null
    regMessage?: string | null
    remindMessage?: string | null
    remindMessage1?: string | null
    limitTime?: boolean
    limitDays: number | null
    limitHours: number | null
    limitMinutes: number | null
}
export interface OccasionCreationAttributes extends Optional<OccasionAttributes, "occasionId" | "timeCancel" | "textCancel" | "canCancel" | "cancelMessage" | "regMessage" | "remindMessage" | "remindMessage1" | "limitTime" | "limitDays" | "limitHours" | "limitMinutes"> { }
class Occasion extends Model<OccasionAttributes, OccasionCreationAttributes> {
    public occasionId!: number
    public type!: occasionType
    public title!: string
    public telephone!: string
    public address!: string
    public zipPostal!: string
    public timeCancel!: number | null
    public textCancel!: string | null
    public canCancel!: boolean
    public cancelMessage!: string | null
    public regMessage!: string | null
    public remindMessage!: string | null
    public remindMessage1!: string | null
    public limitTime!: boolean
    public limitDays!: number | null
    public limitHours!: number | null
    public limitMinutes!: number | null

    //TIMESTAMPS
    public readonly createdAt!: Date
    public readonly updatedAt!: Date
    public readonly deletedAt!: Date
    public readonly occurrences?: Occurrence[]
    public static associations: {
        occurrences: Association<Occasion, Occurrence>
    }
    static initClass(sequelize: Sequelize) {
        return Occasion.init({
            occasionId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            type: { type: DataTypes.STRING(20), allowNull: false },
            title: { type: DataTypes.STRING(100), allowNull: false },
            telephone: { type: DataTypes.STRING(500), allowNull: false },
            address: { type: DataTypes.STRING(200), allowNull: false },
            zipPostal: { type: DataTypes.STRING(10), allowNull: false },
            timeCancel: { type: DataTypes.INTEGER, allowNull: true },
            textCancel: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
            canCancel: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            cancelMessage: { type: DataTypes.STRING(1000), allowNull: true },
            regMessage: { type: DataTypes.STRING(1000), allowNull: true },
            remindMessage: { type: DataTypes.STRING(1000), allowNull: true },
            remindMessage1: { type: DataTypes.STRING(1000), allowNull: true },
            limitTime: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            limitDays: { type: DataTypes.SMALLINT, allowNull: true, defaultValue: null },
            limitHours: { type: DataTypes.SMALLINT, allowNull: true, defaultValue: null },
            limitMinutes: { type: DataTypes.SMALLINT, allowNull: true, defaultValue: null }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'occasions', modelName: 'Occasion', name: { singular: 'Occasion', plural: 'occasions' } })
    }
    static async occasionDetails(occasionId: number) {
        let occasion = await Occasion.findByPk(occasionId, {
            attributes: {
                exclude: ['textCancel', 'cancelMessage', 'regMessage', 'remindMessage', 'remindMessage1', 'createdAt', 'updatedAt', 'deletedAt']
            },
            raw: true
        })
        return occasion
    }
    static async detailed(occasionId: number, occuWhere: WhereAttributeHash) {
        let occasionData = await Occasion.findByPk(occasionId, {
            attributes: {
                include: [
                    [fn('MAX', col('occurrences.startAt')), 'end'],
                    [fn('MIN', col('occurrences.startAt')), 'start'],
                    [cast(fn('SUM', col('occurrences.maxAttendee')), 'signed'), 'maxCapacity'],
                ],
                exclude: ['createdAt', 'updatedAt', 'deletedAt']
            },
            include: {
                association: Occasion.associations.occurrences,
                attributes: []
            }
        })
        if (occasionData == null) return null
        occuWhere.occasionId = occasionData.occasionId
        let sumExpected = 0, sumAttended = 0, maxCapacity = 0
        let occurrences = await Occurrence.findAll(
            {
                where: occuWhere,
                attributes: {
                    // include: [[fn('DATE_FORMAT', literal('DATE_ADD(`startAt`, INTERVAL 9 HOUR)'), '%Y-%m-%d'), 'groupDate']],
                    include: [[fn('DATE_FORMAT', col('startAt'), '%Y-%m-%d'), 'groupDate']],
                    exclude: ['startTime', 'occasionId', 'createdAt', 'updatedAt', 'deletedAt']
                },
                include: {
                    association: Occurrence.associations.registrations,
                    attributes: ['expected', 'attended']
                },
                order: [['startAt', 'ASC']]
            }).then(occus => occus.map(occu => {
                let o: any = occu.toJSON()
                // o.groupDate = new Date(o.startAt).toISOString().slice(0, 10)
                o.sumExpected = 0
                o.sumAttended = 0
                o.registrations.forEach((regi: Registration) => {
                    o.sumExpected += regi.expected
                    o.sumAttended += regi.attended
                });
                maxCapacity += o.maxAttendee
                sumExpected += o.sumExpected
                sumAttended += o.sumAttended
                o.registrations = undefined
                return o
            })
            )
        return { ...occasionData.toJSON(), sumExpected, sumAttended, occurrences }
    }
    static async overview(isMaster = false, type?: occasionType) {
        let currentOccurrences = await Occurrence.findAll({ where: { startAt: { [Op.gte]: (new Date) }, isDisplayed: true }, attributes: [[Sequelize.literal('DISTINCT `occasionId`'), 'occasionId'], 'occasionId'] })
        let where: WhereAttributeHash = isMaster ? {} : { occasionId: { [Op.in]: currentOccurrences.map(cO => cO.occasionId) } }
        let occasionAttrExclude = ['createdAt', 'updatedAt', 'deletedAt']
        let occasionAttrInclude: any[] = [
            [fn('MIN', col('startAt')), 'start'], [fn('MAX', col('startAt')), 'end']
        ]
        if (!isMaster) {
            occasionAttrExclude.push('regMessage', 'remindMessage', 'remindMessage1')
            where.type = type
        } else {
            occasionAttrInclude.push(
                [cast(fn('IFNULL', fn('SUM', col('occurrences.registrations.expected')), 0), 'signed'), 'sumExpected'],
                [cast(fn('IFNULL', fn('SUM', col('occurrences.registrations.attended')), 0), 'signed'), 'sumAttended']
            )
        }
        let occasions: any[] = (await Occasion.findAll({
            attributes: {
                exclude: occasionAttrExclude,
                include: occasionAttrInclude
            },
            where: where,
            include: {
                association: Occasion.associations.occurrences,
                required: false,
                attributes: [],
                include: [{ association: Occurrence.associations.registrations, attributes: [] }]
            },
            group: ['occasionId'],
            order: [[col('occasionId'), 'DESC']]
            // order: [[col('start'), 'ASC']]
        })).map(o => o.toJSON())
        let occurrencesData = await Occurrence.findAll({
            where: { occasionId: { [Op.in]: occasions.map(o => o.occasionId) } },
            attributes: [
                'occasionId',
                [cast(fn('IFNULL', fn('SUM', col('maxAttendee')), 0), 'signed'), 'maxCapacity']
            ],
            group: ['occasionId']
        })
        for await (let occu of occurrencesData) {
            let curOcca = occasions.find((occa: Occasion) => occa.occasionId == occu.occasionId)
            if (curOcca != undefined) {
                //@ts-ignore
                curOcca.maxCapacity = occu.toJSON().maxCapacity
            }
        }
        return occasions
    }
    static async GetOccasionForNotification(occasionWhere: WhereAttributeHash, occurrenceWhere: WhereAttributeHash, registrationWhere: WhereAttributeHash, customerWhere: WhereAttributeHash) {
        let registrations = await Occasion.findAll({
            where: occasionWhere,
            include: {
                association: Occasion.associations.occurrences,
                where: occurrenceWhere,
                include: [{
                    association: Occurrence.associations.registrations,
                    where: registrationWhere,
                    attributes: ['registrationId', 'customerId', 'isNotified', 'isNotified1'],
                    include: [{
                        association: Registration.associations.Customer,
                        where: customerWhere,
                        attributes: ['firstName', 'lastName', 'email']
                    }]
                }]
            }
        })
        return registrations
    }
}
export { Occasion as Occasion }