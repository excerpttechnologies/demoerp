const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callType: {
    type: String,
    required: true,
    enum: ['Inbound', 'Outbound', 'Missed', 'Voicemail']
  },
  purpose: {
    type: String,
    required: true,
    enum: ['Sales', 'Support', 'Follow-up', 'Demo', 'Meeting', 'Consultation', 'Other']
  },
  outcome: {
    type: String,
    required: true,
    enum: ['Successful', 'No Answer', 'Busy', 'Follow-up Required', 'Completed', 'Cancelled', 'Rescheduled']
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
callSchema.index({ companyId: 1, });
=======
callSchema.index({ companyId: 1, financialYear: 1 });
>>>>>>> 948a3a4afe237890d7cbd6596f6f9dcdffcf9f20

module.exports = mongoose.model('Call', callSchema);