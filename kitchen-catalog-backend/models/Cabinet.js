const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DimensionSchema = new Schema({
  width: String,
  code: String // Assuming each dimension has a code field
});

const SubcategorySchema = new Schema({
  name: String,
  image_url: String,
  dimensions: [DimensionSchema]
});

const CabinetSchema = new Schema({
  type: String,
  name: String,
  description: String,
  dimensions: String,
  image_url: String,
  subcategories: [SubcategorySchema]
});

module.exports = mongoose.model('Cabinet', CabinetSchema);