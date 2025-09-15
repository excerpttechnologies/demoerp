const mongoose = require('mongoose');

const vendorPriceListSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorCategory', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  unit: { type: String, required: true }, // location
  bum: { type: Number, required: true },
  buyer:{type:String},
  price: { type: Number, required: true },
  taxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' } ,
  orderUnit: { type: Number, required: true },
   companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
   financialYear:String

}, { timestamps: true });

module.exports = mongoose.model('VendorPriceList', vendorPriceListSchema);
