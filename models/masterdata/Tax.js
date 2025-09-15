const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  taxCode: { type: String, required: true, maxlength: 4 },
  taxName: { type: String, required: true, maxlength: 25 },
  cgst: { type: String, maxlength: 2 },
  sgst: { type: String, maxlength: 2 },
  igst: { type: String, maxlength: 2 },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  financialYear: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Tax', taxSchema);
