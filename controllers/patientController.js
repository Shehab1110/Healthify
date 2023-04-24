const { default: mongoose } = require('mongoose');
const { Configuration, OpenAIApi } = require('openai');
const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');
const EMR = require('../models/emrModel');
const Patient = require('../models/patientModel');
const Rating = require('../models/ratingsSchema');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const configuration = new Configuration({
  organization: 'org-NKvTpaIjb2QEEcmGmqu8gh9S',
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.searchDoctorsBySpeciality = async (req, res, next) => {
  const { user } = req;
  const { speciality, coordinates } = req.params;
  const [latitude, longitude] = coordinates.split(',');
  const maxDistance = 100000;
  if (!speciality)
    return next(new AppError('Please provide a specialty!', 400));
  const doctors = await Doctor.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true,
        distanceMultiplier: 0.001,
      },
    },
    {
      $match: { speciality },
    },
    {
      $project: {
        name: 1,
        speciality: 1,
        availableTimes: 1,
        distance: 1,
        rate: 1,
        ratingNum: 1,
      },
    },
  ]);
  if (doctors.length === 0) return next(new AppError('No Doctors Found!', 404));

  res.status(200).json({
    status: 'success',
    data: doctors,
  });
};

exports.searchDoctors = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { name, speciality } = req.params;
  const maxDistance = 100000;
  if (!name && !speciality)
    return next(
      new AppError('You should provide a name or a speciality!', 400)
    );
  let pipeline = [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [
            parseFloat(user.location.coordinates[0]),
            parseFloat(user.location.coordinates[1]),
          ],
        },
        distanceField: 'distance',
        maxDistance: maxDistance,
        spherical: true,
        distanceMultiplier: 0.001,
      },
    },
    {
      $match: {
        name: { $regex: `^Dr. ${name}` },
      },
    },
    {
      $project: {
        name: 1,
        speciality: 1,
        availableTimes: 1,
        distance: 1,
        rate: 1,
        ratingNum: 1,
      },
    },
  ];
  if (speciality) {
    pipeline.unshift({
      $match: {
        speciality: { $regex: speciality, $options: 'i' },
      },
    });
  }
  const doctors = await Doctor.aggregate(pipeline);
  if (doctors.length === 0) return next(new AppError('No doctors found!'), 404);
  res.status(200).json({
    status: 'success',
    data: doctors,
  });
});

// View Doctor By his ID
exports.viewDoctorByID = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).select('+availableTimes');
  if (!doctor) return next(new AppError('This doctor ID is invalid!'), 400);
  res.status(200).json({
    status: 'success',
    data: doctor,
  });
});

// View Doctor By UserID
exports.viewDoctorByUserID = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user_id: req.params.id }).select(
    '+availableTimes'
  );
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

exports.viewMyAppointments = catchAsync(async (req, res, next) => {
  const { user } = req;
  const appointments = await Appointment.find({ patient_id: user.id }).populate(
    'doctor_id',
    'name'
  );

  if (appointments.length === 0)
    return next(new AppError('No upcoming appointments yet!'), 404);
  res.status(200).json({
    status: 'success',
    data: appointments,
  });
});

exports.viewAppointmentEMR = catchAsync(async (req, res, next) => {
  const appointmentID = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(appointmentID))
    return next(new AppError('Please provide a valid appointment ID!', 400));
  const emr = await EMR.findOne({ appointment: appointmentID });
  if (!emr)
    return next(new AppError('No EMR related to this appointment!', 404));
  res.status(200).json({
    status: 'success',
    data: emr,
  });
});

exports.viewMyEMRs = catchAsync(async (req, res, next) => {
  const { user } = req;
  const patient = await Patient.findOne({ user_id: user.id }).populate('emrs');
  const { emrs } = patient;
  if (emrs === 0)
    return next(new AppError('No EMRs have been created yet!', 404));
  res.status(200).json({
    status: 'success',
    data: emrs,
  });
});

exports.calculateBMI = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { weight, height } = req.body;
  if (!weight || !height)
    return next(
      new AppError('Please enter weight in KG and height in cm!', 400)
    );
  const bmi = weight / (height / 100) ** 2;
  const patient = await Patient.findOneAndUpdate(
    { user_id: user.id },
    { weight, height, bmi },
    { new: true }
  ).select('+bmi');
  res.status(200).json({
    status: 'success',
    data: patient,
  });
});

exports.createMedicineReminder = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { name, type, frequency } = req.body;
  const nextReminder = new Date(Date.now() + frequency * 3600 * 1000);
  const patient = await Patient.findOne({ user_id: user.id });
  patient.medicineReminders.push({ name, type, frequency, nextReminder });
  await patient.save();
  res.status(201).json({
    status: 'success',
    data: patient.medicineReminders,
  });
});

exports.viewMyMedicineReminders = catchAsync(async (req, res, next) => {
  const { user } = req;
  const patient = await Patient.findOne({ user_id: user.id });
  if (!patient)
    return next(
      new AppError('Something wnet wrong, please try again later!'),
      500
    );
  const { medicineReminders } = patient;
  res.status(200).json({
    status: 'success',
    data: medicineReminders,
  });
});

exports.updateMedicineReminder = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { name, type, frequency } = req.body;
  const { reminderID } = req.params;
  let nextReminder;
  if (frequency) nextReminder = new Date(Date.now() + frequency * 3600 * 1000);
  const patient = await Patient.findOne({ user_id: user.id });
  const existingReminderIndex = patient.medicineReminders.findIndex(
    (o) => o.id === reminderID
  );
  if (existingReminderIndex === -1)
    return next(new AppError('Invalid Reminder ID!', 400));
  const existingReminder = patient.medicineReminders[existingReminderIndex];
  patient.medicineReminders[existingReminderIndex] = {
    name: name || existingReminder.name,
    type: type || existingReminder.type,
    frequency: frequency || existingReminder.frequency,
    nextReminder: nextReminder || existingReminder.frequency,
  };
  await patient.save();
  res.status(200).json({
    status: 'success',
    data: patient,
  });
});

exports.deactivateMedicineReminder = catchAsync(async (req, res, next) => {
  const { user } = req;
  if (!req.body.reminderID)
    return next(new AppError('Please provide a valid reminder ID!'), 400);
  if (!mongoose.Types.ObjectId.isValid(req.body.reminderID))
    return next(new AppError('Invalid reminder ID!'), 400);
  const patient = await Patient.findOne({ user_id: user.id });
  const existingReminderIndex = patient.medicineReminders.findIndex(
    (o) => o.id === req.body.reminderID
  );
  if (existingReminderIndex === -1)
    return next(new AppError('No reminder with that ID!', 400));
  patient.medicineReminders[existingReminderIndex].active = false;
  await patient.save();
  res.status(200).json({
    status: 'success',
    data: patient.medicineReminders,
  });
});

exports.activateMedicineReminder = catchAsync(async (req, res, next) => {
  const { user } = req;
  if (!req.body.reminderID)
    return next(new AppError('Please provide a valid reminder ID!'), 400);
  if (!mongoose.Types.ObjectId.isValid(req.body.reminderID))
    return next(new AppError('Invalid reminder ID!'), 400);
  const patient = await Patient.findOne({ user_id: user.id });
  const existingReminderIndex = patient.medicineReminders.findIndex(
    (o) => o.id === req.body.reminderID
  );
  if (existingReminderIndex === -1)
    return next(new AppError('No reminder with that ID!', 400));
  patient.medicineReminders[existingReminderIndex].active = true;
  await patient.save();
  res.status(200).json({
    status: 'success',
    data: patient.medicineReminders,
  });
});

exports.deleteMedicineReminder = catchAsync(async (req, res, next) => {
  const { user } = req;
  const patient = await Patient.findOne({ user_id: user.id });
  if (!req.params.reminderID)
    return next(new AppError('Please provide a reminder ID!', 400));
  if (!mongoose.Types.ObjectId.isValid(req.params.reminderID))
    return next(new AppError('Invalid reminder ID!'), 400);
  const existingReminderIndex = patient.medicineReminders.findIndex(
    (o) => o.id === req.params.reminderID
  );
  if (existingReminderIndex === -1)
    return next(new AppError('No reminder with that ID!', 400));
  patient.medicineReminders.splice(existingReminderIndex, 1);
  await patient.save();
  res.status(200).json({
    status: 'success',
    data: patient,
  });
});

exports.rateAndReview = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { doctorID, rating, review } = req.body;
  if (!doctorID || !rating || !review)
    return next(
      new AppError('Please provide doctorID, rating and a review!', 400)
    );
  if (!mongoose.Types.ObjectId.isValid(doctorID))
    return next(new AppError('Please provide a valid doctor ID!', 400));
  const patient = await Patient.findOne({ user_id: user.id }).populate(
    'appointments'
  );
  const existingAppointmentIndex = patient.appointments.findIndex(
    (o) => o.doctor_id == doctorID && o.status === 'completed'
  );
  if (existingAppointmentIndex === -1)
    return next(new AppError(`You can't rate this doctor!`, 401));
  let doctor = await Doctor.findOne({ user_id: doctorID }).populate(
    'ratingsAndReviews'
  );
  if (doctor.ratingsAndReviews.length > 0) {
    const existingRRIndex = doctor.ratingsAndReviews.findIndex(
      (o) => JSON.stringify(o.user) === JSON.stringify(user.id)
    );
    if (existingRRIndex !== -1)
      return next(new AppError('You already rated this doctor once!', 403));
  }
  const newRating = await Rating.create({
    rating,
    review,
    user: user.id,
  });
  doctor = await Doctor.findOneAndUpdate(
    { user_id: doctorID },
    {
      $push: { ratingsAndReviews: newRating.id },
    },
    { new: true }
  ).populate('ratingsAndReviews');
  const ratings = doctor.ratingsAndReviews;
  let totalRating = 0;
  for (let i = 0; i < ratings.length; i++) {
    totalRating += ratings[i].rating;
  }
  const averageRating = totalRating / ratings.length;
  doctor.rate = averageRating;
  doctor.ratingNum = ratings.length;
  await doctor.save();
  res.status(200).json({
    status: 'success',
    data: doctor,
  });
});

exports.diagnoseSymptoms = catchAsync(async (req, res, next) => {
  if (!req.body.symptoms)
    return next(new AppError('Please provide your symptoms!', 400));
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: `Based on my symptoms, can you help diagnose what medical condition I might have? My symptoms include: ${req.body.symptoms}.`,
    max_tokens: 2048,
    temperature: 0,
  });
  res.status(200).json({
    status: 'success',
    data: response.data.choices[0].text,
  });
});
