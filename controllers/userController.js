const multer = require('multer');
const sharp = require('sharp');
const validator = require('validator');

const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const Booking = require('../models/bookingModel');

// To store the image in memory
const multerStorage = multer.memoryStorage();

// To accept only images and reject other files
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) cb(null, true);
  else cb(new AppError('Not an image! Please upload only images.', 400), false);
};

// To upload the image to the memory
exports.uploadUserPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
}).single('photo');

// To resize the image and save it to the disk
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

// For Authenticated User
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.file) req.body.photo = req.file.filename;
  if (!req.file) req.body.photo = req.user.photo;
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError('This route is not for updating password!', 400));
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
      photo: req.body.photo,
    },
    { new: true, runValidators: true }
  );
  if (req.body.name && req.user.role === 'patient') {
    await Patient.findOneAndUpdate(
      { user_id: req.user.id },
      { name: req.body.name },
      { runValidators: true }
    );
  }
  if (req.file && req.user.role === 'doctor') {
    await Doctor.findOneAndUpdate(
      { user_id: req.user.id },
      {
        photo: req.body.photo,
        address: req.body.address,
        about: req.body.about,
        appointmentPrice: req.body.appointmentPrice,
      },
      {
        runValidators: true,
      }
    );
  }
  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.cancelAppointmentByID = catchAsync(async (req, res, next) => {
  if (!validator.isMongoId(req.params.id))
    return next(new AppError('Invalid appointment ID!'), 400);
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    {
      status: 'cancelled',
    },
    { new: true }
  );
  if (!appointment) return next(new AppError('Invalid appointment ID!'), 400);
  const { date, time, patient_id, doctor_id } = appointment;
  const bookingID = appointment.booking;
  const doctor = await Doctor.findById(doctor_id).select('+availableTimes');
  const existingIndex = doctor.availableTimes.findIndex(
    (o) => o.day.getTime() === date.getTime()
  );
  if (existingIndex === -1)
    return next(new AppError('Something Went Wrong!', 400));
  doctor.availableTimes[existingIndex].hourRange.push(time);
  const UpdatedDoctorAppointments = doctor.appointments.filter(
    (a) => a.toString() !== appointment.id.toString()
  );
  doctor.appointments = UpdatedDoctorAppointments;
  await doctor.save();
  const patient = await Patient.findOne({ user_id: patient_id });
  const updatedPatientAppointments = patient.appointments.filter(
    (a) => a.toString() !== appointment.id.toString()
  );
  patient.appointments = updatedPatientAppointments;
  await patient.save();

  await Booking.findByIdAndUpdate(bookingID, { status: 'cancelled' });

  res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

// For Admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({ active: { $ne: false } }).select('-__v');
  res.status(200).json({
    status: 'success',
    data: users,
  });
});
