import { Router } from "express";
import { CustomerController } from "../controllers/customer.controller";
import { MasterController } from "../controllers/master.controller";
import { OccasionController } from "../controllers/occasion.controller";
import { OccurrenceController } from "../controllers/occurrence.controller";
import { TemplateController } from "../controllers/template.controller";
import { SystemSettingController } from "../controllers/system.controller";
import { param } from "express-validator";
const router = Router()
router.post('/managers', MasterController.createManager)
router.get('/customers/csv',CustomerController.getCustomersCSV)
router.post('/registrations/new', MasterController.createCustomerRegistration)
router.put('/registrations/edit', MasterController.updateCustomerRegistration)
router.delete('/registrations/cancel', MasterController.cancelCustomerRegistration)
router.delete('/customers/:customerId', CustomerController.delete)
router.post('/registrations', MasterController.getCustomerRegistration)
router.put('/registrations', MasterController.confirmRegistration)
router.post('/occasions', OccasionController.create)
router.get('/events/list', OccasionController.listBasic)
router.get('/events/detail/:occasionId', OccasionController.basicInfo)
router.get('/occasions/overview', OccasionController.overview)
router.get('/occasions/:occasionId/schedule', OccasionController.getEventScheduleSimple)
router.post('/occasions/:occasionId/csv', OccasionController.downloadEventCSV)
router.get('/occasions/:occasionId', OccasionController.getEventDetailed)
router.put('/occasions/:occasionId', OccasionController.update)
router.delete('/occasions/:occasionId', OccasionController.delete)

router.get('/occurrences/:occurrenceId', OccurrenceController.find)
router.put('/occurrences/:occurrenceId', OccurrenceController.update)
// router.post('/occurrences/:occurrenceId/csv', OccasionController.downloadOccurrenceCSV)
router.post('/occurrences', OccurrenceController.editOccurrences)
router.delete('/occurrences/:occurrenceId', OccurrenceController.delete)


router.post('/templates', TemplateController.create)
router.get('/templates', TemplateController.browse)
router.get('/templates/:occasionId', TemplateController.find)
router.put('/templates/:occasionId', TemplateController.update)
router.delete('/templates/:occasionId', TemplateController.delete)


router.get('/settings', SystemSettingController.getSystemSettings)
router.get('/settings/:key', param('key').isString(), SystemSettingController.getSystemSettings)
router.put('/settings/:key', param('key').isString(), SystemSettingController.setSystemSettings)
router.delete('/settings/:key', param('key').isString(), SystemSettingController.deleteSettings)

export { router }