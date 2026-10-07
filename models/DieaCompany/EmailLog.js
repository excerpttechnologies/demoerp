const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoicediea',
    required: true,
  },
  invoiceNo: {
    type: Number,
    required: true,
  },
  to: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
  },
  messageId: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
    required: true,
  },
  error: {
    type: String,
    default: '',
  },
  providerResponse: {
    type: String,
    default: '',
  },
  isTest: {
    type: Boolean,
    default: false,
  },
  sentAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('DieaInvoiceEmailLog', emailLogSchema);