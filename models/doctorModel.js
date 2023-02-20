const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  speciality: {
    type: String,
  },
  certification: {
    type: String,
  },
  office_location: {
    type: String,
  },
});

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
