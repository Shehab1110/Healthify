const validator = require('validator');

const Doctor = require('../models/doctorModel');
const Appointment = require('../models/appointmentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Patient = require('../models/patientModel');
const EMR = require('../models/emrModel');

exports.setAvailableTimes = catchAsync(async (req, res, next) => {
  const { availableTimes } = req.body;
  if (
    !availableTimes ||
    !availableTimes.day ||
    !availableTimes.startTime ||
    !availableTimes.endTime
  )
    return next(
      new AppError('Please provide available times in the correct format1', 400)
    );
  if (
    !validator.isISO8601(availableTimes.day) ||
    !validator.isAfter(availableTimes.day)
  )
    return next(
      new AppError(
        `Please provide a valid date and a date that's yet to come!`,
        400
      )
    );
  availableTimes.hourRange = [];
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
  const appointments = await Appointment.find({ doctor_id: user.id }).populate({
    path: 'patient_id',
    select: 'name photo',
  });

  if (appointments.length === 0)
    return next(new AppError('No upcoming appointments yet!'), 404);
  const completedAppointments = appointments.filter(
    (appointment) => appointment.status === 'completed'
  );
  const scheduledAppointments = appointments.filter(
    (appointment) => appointment.status !== 'completed'
  );
  const todayAppointments = scheduledAppointments.filter(
    (appointment) => appointment.date.getDate() === new Date().getDate()
  );
  const upcomingAppointments = scheduledAppointments.filter(
    (appointment) => appointment.date.getDate() > new Date().getDate()
  );
  const pastAppointments = scheduledAppointments.filter(
    (appointment) => appointment.date.getDate() < new Date().getDate()
  );
  res.status(200).json({
    status: 'success',
    data: {
      completedAppointments,
      todayAppointments,
      upcomingAppointments,
      pastAppointments,
    },
  });
});

exports.markAppointmentAsCompletedByID = catchAsync(async (req, res, next) => {
  const { id } = req.body;
  const appointment = await Appointment.findById(id);
  if (appointment.status === 'cancelled')
    return next(new AppError('The appointment was cancelled!'), 400);
  if (appointment.status === 'completed')
    return next(new AppError('The appointment is already completed!'), 400);
  appointment.status = 'completed';
  await appointment.save();
  res.status(200).json({
    status: 'success',
    data: appointment,
  });
});

exports.createPatientEMR = catchAsync(async (req, res, next) => {
  const doctorID = req.user.id;
  const { appointmentID } = req.body;
  if (!appointmentID || !validator.isMongoId(appointmentID))
    return next(new AppError('Please provide a valid appoitnment ID!', 400));
  const appointment = await Appointment.findById(appointmentID);
  if (!appointment) return next(new AppError('Invalid appointment ID!', 400));
  if (
    appointment.doctor_id.toString() !== doctorID.toString() ||
    appointment.status !== 'completed'
  )
    return next(new AppError(`You don't have permissions!`));
  if (appointment.emr)
    return next(
      new AppError(`There's an existing emr for this appointment!`, 400)
    );
  const emr = await EMR.create({
    patient: appointment.patient_id,
    doctor: doctorID,
    appointment: appointment.id,
    diagnosis: req.body.diagnosis,
    medication: req.body.medication,
    dosage: req.body.dosage,
    instructions: req.body.instructions,
    notes: req.body.notes,
    createdAt: appointment.date,
  });
  appointment.emr = emr.id;
  await appointment.save();
  await Patient.findOneAndUpdate(
    { user_id: appointment.patient_id },
    {
      $push: { emrs: emr.id },
    }
  );
  res.status(200).json({
    status: 'success',
    data: emr,
  });
});

exports.viewPatientEMR = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return next(new AppError('Invalid appointment ID!'), 400);
  if (!(appointment.status === 'completed'))
    return next(new AppError(`Appointment isn't completed!`, 400));
  const emr = await EMR.findById(appointment.emr);
  if (!emr)
    return next(
      new AppError(`EMR hasn't been created for this appointment yet!`, 400)
    );
  res.status(200).json({
    status: 'success',
    data: emr,
  });
});

exports.updatePatientEMR = async (req, res, next) => {
  const { appointmentID, diagnosis, medication, dosage, instructions, notes } =
    req.body;
  if (!appointmentID || !validator.isMongoId(appointmentID))
    return next(new AppError('Please provide a valid appoitnment ID!', 400));
  const appointment = await Appointment.findById(appointmentID);
  if (!appointment) return next(new AppError('Invalid Appointment ID!', 400));
  if (
    appointment.doctor_id.toString() !== req.user.id.toString() ||
    appointment.status !== 'completed'
  )
    return next(new AppError(`You don't have permissions!`));
  if (appointment.emr === null)
    return next(
      new AppError(`EMR hasn't been created for this appointment yet!`, 400)
    );
  const emr = await EMR.findByIdAndUpdate(
    appointment.emr,
    {
      diagnosis,
      medication,
      dosage,
      instructions,
      notes,
    },
    { new: true }
  );
  res.status(200).json({
    status: 'success',
    data: emr,
  });
};
