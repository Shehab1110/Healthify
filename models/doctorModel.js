/* eslint-disable no-plusplus */
/* eslint-disable no-unused-expressions */
/* eslint-disable radix */
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
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
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
  ratingNum: {
    type: Number,
    default: 0,
  },
  rate: {
    type: Number,
    default: 5,
  },
});

doctorSchema.index({ location: '2dsphere' });

doctorSchema.methods.getHourRange = function (start, end) {
  const hourRange = [];
  let returnedHourRange = [];
  let hour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);
  while (hour <= endHour) {
    let ext;
    hour < 12 ? (ext = 'AM') : (ext = 'PM');
    hourRange.push(`${hour.toString().padStart(2, '0')}:00 ${ext}`);
    if (hour !== endHour)
      hourRange.push(`${hour.toString().padStart(2, '0')}:30 ${ext}`);
    hour++;
  }
  returnedHourRange = hourRange.map((el) => {
    if (parseInt(el.split(':')[0]) > 12)
      el = `${parseInt(el.split(':')[0]) - 12}:${el.split(':')[1]}`;
    return el;
  });
  return returnedHourRange;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
