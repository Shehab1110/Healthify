const mongoose = require('mongoose');
const validator = require('validator');

const patientSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  //   phone_number: {
  //     type: String,
  //     validate: [validator.isMobilePhone, 'Please provide a valid phone number!'],
  //   },
  height: {
    type: Number,
    min: [150, 'Please enter your height correctly in cm!'],
    max: [250, 'Please enter your height correctly in cm!'],
    select: false,
  },
  weight: {
    type: Number,
    min: [40, 'Please enter your weight correctly in kg!'],
    max: [200, 'Please enter your weight correctly in kg!'],
    select: false,
  },
  bmi: {
    type: Number,
    select: false,
  },
});

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
