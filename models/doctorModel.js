/* eslint-disable no-plusplus */
/* eslint-disable no-unused-expressions */
/* eslint-disable radix */
const mongoose = require('mongoose');
const AppError = require('../utils/appError');

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
  photo: {
    type: String,
    default: 'default.jpg',
  },
  speciality: {
    type: String,
    required: true,
  },
  certification: {
    type: String,
  },
  about: {
    type: String,
    // required: [true, 'Please tell us about yourself!'],
    trim: true,
    maxlength: 250,
  },
  address: {
    type: String,
    // required: [true, 'Please tell us your address!'],
    trim: true,
    maxlength: 250,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
  },
  appointmentPrice: {
    type: Number,
    // required: [true, 'Please tell your appointment price!'],
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

doctorSchema.methods.checkAvailability = function (date, time, next) {
  const appointmentDate = new Date(date);
  // Check if the doctor is available at the selected date
  const day = this.availableTimes.find(
    (el) => el.day.getTime() === appointmentDate.getTime()
  );
  if (!day)
    return next(
      new AppError('The doctor schedule is not yet defined for that day.', 400)
    );
  // Check if the doctor is available at the selected time
  if (!day.hourRange.includes(time))
    return next(new AppError('Selected time is no longer available!', 400));
  const newAvailableHours = day.hourRange.filter((el) => el !== time);
  day.hourRange = newAvailableHours;

  const existingObjIndex = this.availableTimes.findIndex(
    (o) => o.day.getTime() === new Date(this.availableTimes.day).getTime()
  );
  this.availableTimes[existingObjIndex] = day;
  return true;
};

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
