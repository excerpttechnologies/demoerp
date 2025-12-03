const mongoose = require('mongoose');

const purchaseCategorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true },
<<<<<<< HEAD
  // prefix: { type: String, required: true },
=======
  prefix: { type: String, required: true },
>>>>>>> 948a3a4afe237890d7cbd6596f6f9dcdffcf9f20
  rangeStart: { type: Number, required: true },
  rangeEnd: { type: Number, required: true } 
}, { timestamps: true });

// Change model name here to 'MaterialCategory'
module.exports = mongoose.model('Purchasecategory', purchaseCategorySchema);

