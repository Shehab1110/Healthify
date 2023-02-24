const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setAvailableTimes = catchAsync(async (req, res, next) => {
  const { availableTimes } = req.body;
  const doctorId = req.user.id;
  const doctor = await Doctor.findOne({ user_id: doctorId }).select(
    '+availableTimes'
  );
  availableTimes.hourRange = doctor.getHourRange(
    availableTimes.startTime,
    availableTimes.endTime
  );

  if (doctor) {
    // check if an object with the same day already exists in the array
    const existingObjIndex = doctor.availableTimes.findIndex(
      (o) => o.day.getTime() === new Date(availableTimes.day).getTime()
    );

    if (existingObjIndex >= 0) {
      // if object with the same day exists, update it
      doctor.availableTimes[existingObjIndex].startTime =
        availableTimes.startTime;
      doctor.availableTimes[existingObjIndex].endTime = availableTimes.endTime;
      doctor.availableTimes[existingObjIndex].hourRange =
        availableTimes.hourRange;
    } else {
      // if object with the same day does not exist, add the new object to the array
      doctor.availableTimes.push(availableTimes);
    }
    await doctor.save();
  } else {
    // handle error if doctor does not exist
    return new AppError(`Doctor with id ${doctorId} not found`, 400);
  }
  res.status(200).json({
    status: 'success',
    data: doctor,
  });
});

exports.viewMyAppointments = catchAsync(async (req, res, next) => {
  const { user } = req;
  const appointments = await Appointment.find({ doctor_id: user.id }).populate(
    'patient_id',
    'name'
  );

  if (appointments.length === 0)
    return next(new AppError('No upcoming appointments yet!'), 404);
  res.status(200).json({
    status: 'success',
    data: appointments,
  });
});
