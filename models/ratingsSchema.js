const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const Doctor = require('./doctorModel');

const ratingsSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10,
    },
    review: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
  },
  {
    timestamps: true,
  }
);

ratingsSchema.index({ doctor: 1, user: 1 }, { unique: true });

ratingsSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

ratingsSchema.statics.calcAverageRatings = async function (doctorId) {
  const stats = await this.aggregate([
    {
      $match: { doctor: doctorId },
    },
    {
      $group: {
        _id: '$doctor',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  if (stats.length > 0) {
    await Doctor.findByIdAndUpdate(doctorId, {
      ratingNum: stats[0].nRating,
      rate: stats[0].avgRating,
    });
  } else {
    await Doctor.findByIdAndUpdate(doctorId, {
      ratingNum: 0,
      rate: 5,
    });
  }
};

// Document middleware for calculating average rating and quantity of ratings for a doctor after a new review is created
ratingsSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.doctor);
});

// Query middleware for calculating average rating and quantity of ratings for a doctor after a review is updated or deleted
// ratingsSchema.pre(/^findOneAnd/, async function (next) {
//   this.r = await this.findOne();
//   next();
// });
// // Query middleware for calculating average rating and quantity of ratings for a doctor after a review is updated or deleted
// ratingsSchema.post(/^findOneAnd/, async function () {
//   await this.r.constructor.calcAverageRatings(this.r.doctor);
// });

const Ratings = mongoose.model('Rating', ratingsSchema);

module.exports = Ratings;
