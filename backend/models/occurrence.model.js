"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Occurrence = void 0;
const sequelize_1 = require("sequelize");
const registration_model_1 = require("./registration.model");
class Occurrence extends sequelize_1.Model {
    static initClass(sequelize) {
        return Occurrence.init({
            occurrenceId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
            occasionId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, unique: 'occaId_occuStart' },
            maxAttendee: { type: sequelize_1.DataTypes.SMALLINT, allowNull: false },
            startAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, unique: 'occaId_occuStart' },
            endAt: { type: sequelize_1.DataTypes.DATE, allowNull: true },
            startTime: { type: sequelize_1.DataTypes.TIME, allowNull: true, defaultValue: true },
            isDisplayed: { type: sequelize_1.DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
        }, { sequelize: sequelize, timestamps: true, paranoid: true, tableName: 'occurrences', modelName: 'Occurrence', name: { singular: 'Occurrence', plural: 'occurrences' } });
    }
    static async detailed(occurrenceId) {
        let occurrence = await Occurrence.findByPk(occurrenceId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt'],
                include: []
            },
            include: [
                {
                    association: Occurrence.associations.registrations,
                    attributes: ['registrationId', 'customerId', 'expected', 'attended', 'isNotified',
                        [(0, sequelize_1.literal)('firstName'), 'firstName'], [(0, sequelize_1.literal)('firstNameKana'), 'firstNameKana'], [(0, sequelize_1.literal)('lastName'), 'lastName'], [(0, sequelize_1.literal)('lastNameKana'), 'lastNameKana'],
                        [(0, sequelize_1.literal)('email'), 'email'], [(0, sequelize_1.literal)('telephone'), 'telephone'], [(0, sequelize_1.literal)('zipPostal'), 'zipPostal'], [(0, sequelize_1.literal)('prefecture'), 'prefecture'], [(0, sequelize_1.literal)('city'), 'city'], [(0, sequelize_1.literal)('address'), 'address'],
                        [(0, sequelize_1.literal)('gender'), 'gender'], [(0, sequelize_1.literal)('dateOfBirth'), 'dateOfBirth'],
                        [(0, sequelize_1.literal)('q2inspectionCount'), 'q2inspectionCount'], [(0, sequelize_1.literal)('q3inspectionPurpose'), 'q3inspectionPurpose'], [(0, sequelize_1.literal)('q4isVaccinated'), 'q4isVaccinated'], [(0, sequelize_1.literal)('q5unvaccinatedReason'), 'q5unvaccinatedReason']
                    ],
                    include: [{
                            association: registration_model_1.Registration.associations.Customer,
                            attributes: []
                        }]
                }
            ]
        });
        let occuDetails = {
            sumExpected: 0,
            sumAttended: 0,
            notified: 0
        };
        occurrence?.registrations?.forEach(r => {
            occuDetails.sumExpected += r.expected ?? 0;
            occuDetails.sumAttended += r.attended ?? 0;
            occuDetails.notified += r.isNotified ? 1 : 0;
        });
        return { ...occuDetails, ...occurrence?.toJSON() };
    }
}
exports.Occurrence = Occurrence;
