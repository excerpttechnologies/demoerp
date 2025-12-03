const mongoose = require('mongoose');

const contactStageSchema = new mongoose.Schema({
  stageName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  order: {
    type: Number,
    required: true
  },
  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  color: {
    type: String,
    default: '#007bff'
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
contactStageSchema.index({ companyId: 1, , order: 1 });
=======
contactStageSchema.index({ companyId: 1, financialYear: 1, order: 1 });
>>>>>>> 948a3a4afe237890d7cbd6596f6f9dcdffcf9f20

module.exports = mongoose.model('ContactStage', contactStageSchema);