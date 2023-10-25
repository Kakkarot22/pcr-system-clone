import { Model, Association, Optional, HasOneGetAssociationMixin, Sequelize, DataTypes, fn, literal, col, cast, Op, WhereAttributeHash } from "sequelize";
import { Occasion } from "./occasion.model";
import { Registration } from "./registration.model";
export interface OccurrenceAttributes {
    occurrenceId?: number
    occasionId?: number
    maxAttendee: number
    startAt: string | Date
    endAt?: string | Date | null
    startTime?: string
    isDisplayed?: boolean | null
    deletedAt?: null | Date
}
export interface OccurrenceCreationAttributes extends Optional<OccurrenceAttributes, "occurrenceId" | "endAt" | "isDisplayed" | "startTime" | "deletedAt"> { }
class Occurrence extends Model<OccurrenceAttributes, OccurrenceCreationAttributes>  {
    public occurrenceId!: number
    public occasionId!: number
    public maxAttendee!: number
    public startAt!: Date
    public endAt!: Date
    public startTime!: string
    public isDisplayed!: boolean | null
    //TIMESTAMPS
    public createdAt!: Date
    public updatedAt!: Date
    public deletedAt!: Date
    public readonly Occasion?: Occasion
    public readonly registrations?: Registration[]
    public static associations: {
        registrations: Association<Occurrence, Registration>
        Occasion: Association<Occasion, Occurrence>
    }
    static initClass(sequelize: Sequelize) {
        return Occurrence.init({
            occurrenceId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            occasionId: { type: DataTypes.INTEGER, allowNull: false, unique: 'occaId_occuStart' },
            maxAttendee: { type: DataTypes.SMALLINT, allowNull: false },
            startAt: { type: DataTypes.DATE, allowNull: false, unique: 'occaId_occuStart' },
            endAt: { type: DataTypes.DATE, allowNull: true },
            startTime: { type: DataTypes.TIME, allowNull: true, defaultValue: true },
            isDisplayed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'occurrences', modelName: 'Occurrence', name: { singular: 'Occurrence', plural: 'occurrences' } })
    }
    static async detailed(occurrenceId: number) {
        let occurrence = await Occurrence.findByPk(occurrenceId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt'],
                include: [
                    // [fn('COUNT', col('registrations.isNotified')), 'notified']
                ]
            },
            include: [
                {
                    association: Occurrence.associations.registrations,
                    attributes: ['registrationId', 'customerId', 'expected', 'attended', 'isNotified',
                        [literal('firstName'), 'firstName'], [literal('firstNameKana'), 'firstNameKana'], [literal('lastName'), 'lastName'], [literal('lastNameKana'), 'lastNameKana'],
                        [literal('email'), 'email'], [literal('telephone'), 'telephone'], [literal('zipPostal'), 'zipPostal'], [literal('prefecture'), 'prefecture'], [literal('city'), 'city'], [literal('address'), 'address'],
                        [literal('gender'), 'gender'], [literal('dateOfBirth'), 'dateOfBirth'],
                        [literal('q2inspectionCount'), 'q2inspectionCount'], [literal('q3inspectionPurpose'), 'q3inspectionPurpose'], [literal('q4isVaccinated'), 'q4isVaccinated'], [literal('q5unvaccinatedReason'), 'q5unvaccinatedReason']
                    ],
                    include: [{
                        association: Registration.associations.Customer,
                        attributes: []
                    }]
                }]
        })
        let occuDetails = {
            sumExpected: 0,
            sumAttended: 0,
            notified: 0
        }

        occurrence?.registrations?.forEach(r => {
            occuDetails.sumExpected += r.expected ?? 0
            occuDetails.sumAttended += r.attended ?? 0
            occuDetails.notified += r.isNotified ? 1 : 0
        })
        return { ...occuDetails, ...occurrence?.toJSON() }
    }
}
export { Occurrence }