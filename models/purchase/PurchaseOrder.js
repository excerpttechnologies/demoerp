// const mongoose = require('mongoose');

// const ItemSchema = new mongoose.Schema({
//   materialId: String,
//   description: String,
//   quantity: Number,
//   baseUnit: String,
//   orderUnit: String,
//   unit: String,
//   price: Number,
//   priceUnit: String,
//   materialgroup: String,
//   buyerGroup: String,
//   deliveryDate: String,
// });

// const PurchaseOrderSchema = new mongoose.Schema({
//   poNumber: String,
//   categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'POCategory' },
//   category: String,
//   date: String,
//   vendor: String,
//   deliveryLocation: String,
//   deliveryAddress: String,           // ✅ NEW
//   quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
//   quotationNumber: String,
//   items: [ItemSchema],
//   remarks: String,
//   approvedby: String,
//   preparedby: String,
//   notes: String,
//   processes: [],
//   generalConditions: [],
//   total: Number,
//   taxName: String,                   // ✅ NEW
//   cgst: Number,                      // ✅ NEW
//   sgst: Number,                      // ✅ NEW
//   igst: Number,                      // ✅ NEW
//   taxDiscount: Number,              // ✅ NEW
//   finalTotal: Number,
//   companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
//   financialYear: String              // ✅ NEW

// });

// module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);



const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  materialId: String,
  description: String,
  quantity: Number,
  baseUnit: String,
  orderUnit: String,
  unit: String,
  price: Number,
  priceUnit: String,
  materialgroup: String,
  buyerGroup: String,
  deliveryDate: String,
});

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: String,
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'POCategory' },
  category: String,
  date: String,
  vendor: String,
  deliveryLocation: String,
  deliveryAddress: String,
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  quotationNumber: String,
  items: [ItemSchema],
  remarks: String,
  approvedby: String,
  preparedby: String,
  notes: String,
  processes: [],
  generalConditions: [],
  total: Number,
  taxName: String,
  cgst: Number,
  sgst: Number,
  igst: Number,
  taxDiscount: Number,
  finalTotal: Number,
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  financialYear: String,
  
  // New approval fields
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  approvalDate: String,
  approvalComments: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
PurchaseOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);