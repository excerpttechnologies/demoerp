const mongoose = require('mongoose');

const sourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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

// Create compound index for efficient querying
<<<<<<< HEAD
sourceSchema.index({ companyId: 1 });
=======
sourceSchema.index({ companyId: 1, financialYear: 1 });
>>>>>>> 948a3a4afe237890d7cbd6596f6f9dcdffcf9f20

module.exports = mongoose.model('Source', sourceSchema);