const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');
const Patient = require('../models/patientModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// search doctors by speciality
exports.searchDoctorsBySpeciality = async (req, res, next) => {
  const { speciality } = req.params;
  if (!speciality)
    return next(new AppError('Please provide a speciality!', 400));
  const doctors = await Doctor.find({ speciality });
  if (doctors.length === 0) return next(new AppError('No Doctors Found!', 404));
  res.status(200).json({
    status: 'success',
    data: doctors,
  });
};

exports.searchDoctors = catchAsync(async (req, res, next) => {
  const { name, speciality } = req.params;
  if (!name && !speciality)
    return next(
      new AppError('You should provide a name or a speciality!'),
      400
    );
  const doctors = await Doctor.find({
    name: { $regex: `^${name}` },
    speciality,
  });
  if (doctors.length === 0) return next(new AppError('No doctors found!'), 404);
  res.status(200).json({
    status: 'success',
    data: doctors,
  });
});

// View Doctor
exports.viewDoctorByID = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).select('+availableTimes');
  if (!doctor) return next(new AppError('This doctor ID is invalid!'), 400);
  res.status(200).json({
    status: 'success',
    data: doctor,
  });
});

exports.scheduleAppointment = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { doctorID, date, time } = req.body;
  if (!doctorID || !date || !time)
    return next(new AppError('Please provide DoctorID, Date and Time!'));
  const doctor = await Doctor.findOne({ user_id: doctorID }).select(
    '+availableTimes'
  );
  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }
  const patient = await Patient.findOne({ user_id: user.id }).populate(
    'appointments'
  );
  const existingAppointment = patient.appointments.find(
    (o) =>
      o.date.getTime() === new Date(date).getTime() &&
      o.time === time &&
      o.status === 'scheduled'
  );
  if (existingAppointment) {
    return next(
      new AppError(`You already have an appointment at the same time`, 400)
    );
  }
  const { availableTimes } = doctor;
  const appointmentDate = new Date(date);
  const day = availableTimes.find(
    (el) => el.day.getTime() === appointmentDate.getTime()
  );
  if (!day)
    return next(
      new AppError('The doctor schedule is not yet defined for that day.', 400)
    );
  if (!day.hourRange.includes(time))
    return next(new AppError('Selected time is unavailable!'), 400);
  const newAvailableHours = day.hourRange.filter((el) => el !== time);
  day.hourRange = newAvailableHours;

  const appointment = await Appointment.create({
    patient_id: user.id,
    doctor_id: doctorID,
    date,
    time,
  });

  await Patient.findOneAndUpdate(
    { user_id: user.id },
    {
      $push: { appointments: appointment.id },
    }
  );

  await Doctor.findOneAndUpdate(
    { user_id: doctorID },
    {
      $push: { appointments: appointment.id },
    }
  );

  const existingObjIndex = doctor.availableTimes.findIndex(
    (o) => o.day.getTime() === new Date(availableTimes.day).getTime()
  );
  doctor.availableTimes[existingObjIndex] = day;
  await doctor.save();

  res.status(200).json({
    status: 'success',
    data: appointment,
  });
});
