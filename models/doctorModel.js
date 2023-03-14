const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell your name!'],
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  speciality: {
    type: String,
    required: true,
  },
  certification: {
    type: String,
  },
  location: {
    coordinates: {
      type: [Number],
    },
  },
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
  ],
  availableTimes: {
    type: [
      {
        day: {
          type: Date,
        },
        startTime: {
          type: String,
        },
        endTime: {
          type: String,
        },
        hourRange: {
          type: [String],
        },
      },
    ],
    default: [],
    select: false,
  },
  ratingsAndReviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ratings',
    },
  ],
  ratingNum: {
    type: Number,
    default: 0,
  },
  rate: {
    type: Number,
    default: 4,
  },
});

doctorSchema.methods.getHourRange = function (start, end) {
  const hourRange = [];
  let hour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);

  while (hour <= endHour) {
    hourRange.push(`${hour.toString().padStart(2, '0')}:00`);
    hour++;
  }

  return hourRange;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
