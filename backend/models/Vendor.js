const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  specialization: [{
    type: String,
    enum: ['extinguisher', 'detector', 'panel', 'sprinkler', 'fire_door', 'alarm', 'hose', 'emergency_light']
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Vendor', vendorSchema);