const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MaterialSchema = new Schema({
  material: { type: String, required: true },
  emissionFactor: { type: Number, required: true }
});

// If you explicitly want to keep the collection name as "Material", specify it in the model
module.exports = mongoose.model('Material', MaterialSchema, 'Material');