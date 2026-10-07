const express = require('express');
const router = express.Router();
const {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  checkInvoiceNumberExists,
  getNextInvoiceNumber,
  getInvoicesByCompany,
  updateInvoice,
  deleteInvoice,
  sendInvoiceEmailById,
  sendInvoiceTestEmailById
} = require('../../controllers/diea/Dieainvoice');

// Invoice CRUD operations
router.post('/', createInvoice);
router.get('/', getAllInvoices);
router.get('/next-number', getNextInvoiceNumber);
router.get('/check/:invoiceNo', checkInvoiceNumberExists);
router.get('/number/:invoiceNo', getInvoiceByNumber);
router.get('/company/:companyId', getInvoicesByCompany);
router.post('/:id/send-mail', sendInvoiceEmailById);
router.post('/:id/send-test-mail', sendInvoiceTestEmailById);
router.get('/:id', getInvoiceById);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;