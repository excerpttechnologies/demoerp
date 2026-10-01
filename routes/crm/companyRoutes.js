const express = require('express');
const router = express.Router();
const companyController = require('../../controllers/crm/Company');
const upload=require('../../middlewares/upload')
router.post('/create', upload.single('logo'), companyController.createCompany);
router.post('/create-for-user', upload.single('logo'), companyController.createCompanyForUser);
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById)

module.exports = router;
