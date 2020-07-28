const mongoose = require('mongoose');
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

const { Schema } = mongoose;

// Define schema for building items
const BuildingSchema = new Schema({
  id: {
    type: String,
  },
  name: {
    type: String,
  },
  address: {
    type: Object,
  },
  verified: {
    type: Boolean,
  },
});

BuildingSchema.index({ id: 1 }, { unique: true });

const building = mongoose.model('building', BuildingSchema);

module.exports = building;
