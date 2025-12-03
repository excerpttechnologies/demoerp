const mongoose = require('mongoose');

const industrySchema = new mongoose.Schema({
  industryName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Technology',
      'Healthcare', 
      'Finance',
      'Manufacturing',
      'Retail',
      'Education',
      'Real Estate',
      'Transportation',
      'Energy',
      'Media',
      'Hospitality',
      'Construction',
      'Agriculture',
      'Other'
    ]
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
industrySchema.index({ companyId: 1,  });
=======
industrySchema.index({ companyId: 1, financialYear: 1 });
>>>>>>> 948a3a4afe237890d7cbd6596f6f9dcdffcf9f20

module.exports = mongoose.model('Industry', industrySchema);