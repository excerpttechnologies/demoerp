const mongoose = require('mongoose');

const lostReasonSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Price', 'Competition', 'Timeline', 'Budget', 'Feature', 'Service', 'Other']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  companyId: {
    type: String,
    required: true
  },
  financialYear: {
    type: String,
<<<<<<< HEAD
=======
    required: true
>>>>>>> 948a3a4afe237890d7cbd6596f6f9dcdffcf9f20
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

<<<<<<< HEAD
lostReasonSchema.index({ companyId: 1 });
=======
lostReasonSchema.index({ companyId: 1, financialYear: 1 });
>>>>>>> 948a3a4afe237890d7cbd6596f6f9dcdffcf9f20

module.exports = mongoose.model('LostReason', lostReasonSchema);