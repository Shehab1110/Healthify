/* eslint-disable no-unused-expressions */
const { Configuration, OpenAIApi } = require('openai');
const validator = require('validator');

const Appointment = require('../models/appointmentModel');
const Booking = require('../models/bookingModel');
const Doctor = require('../models/doctorModel');
const EMR = require('../models/emrModel');
const Patient = require('../models/patientModel');
const Rating = require('../models/ratingsSchema');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  getCheckoutSession,
  createBookingCheckout,
} = require('./bookingController');

const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.searchDoctorsBySpeciality = async (req, res, next) => {
  const { speciality, coordinates } = req.params;
  const [latitude, longitude] = coordinates.split(',');
  // const maxDistance = 100000;
  if (!latitude || !longitude)
    return next(new AppError('Please provide your location!', 400));
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
        // maxDistance: maxDistance,
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
        photo: 1,
        address: 1,
        about: 1,
        appointmentPrice: 1,
      },
    },
  ]);
  if (doctors.length === 0) return next(new AppError('No Doctors Found!', 404));
  const patient = await Patient.findOne({ user_id: req.user.id });
  const { favoriteDoctors } = patient;
  const favorites = favoriteDoctors.map((el) => el.toString());
  doctors.forEach((doctor) => {
    if (favorites.includes(doctor._id.toString())) doctor.favorite = true;
  });
  res.status(200).json({
    status: 'success',
    data: doctors,
  });
};

exports.searchDoctors = catchAsync(async (req, res, next) => {
  const { name, speciality, coordinates } = req.params;
  // const maxDistance = 100000;
  if (!name && !speciality)
    return next(
      new AppError('You should provide a name or a speciality!', 400)
    );
  const pipeline = [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [
            parseFloat(coordinates.split(','[1])),
            parseFloat(coordinates.split(','[0])),
          ],
        },
        distanceField: 'distance',
        // maxDistance: maxDistance,
        spherical: true,
        distanceMultiplier: 0.001,
      },
    },
    {
      $match: {
        name: { $regex: `^Dr. ${name}`, $options: 'i' },
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
        photo: 1,
        address: 1,
        about: 1,
        appointmentPrice: 1,
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
  const patient = await Patient.findOne({ user_id: req.user.id });
  const { favoriteDoctors } = patient;
  const favorites = favoriteDoctors.map((el) => el.toString());
  doctors.forEach((doctor) => {
    if (favorites.includes(doctor._id.toString())) doctor.favorite = true;
  });
  res.status(200).json({
    status: 'success',
    data: doctors,
  });
});
// View Doctor By his ID
exports.viewDoctorByID = catchAsync(async (req, res, next) => {
  let favorite;
  const doctor = await Doctor.findById(req.params.id).select('+availableTimes');
  if (!doctor) return next(new AppError('This doctor ID is invalid!'), 400);
  const ratings = await Rating.find({ doctor_id: doctor.id }).select(
    'rating review'
  );
  const patient = await Patient.findOne({ user_id: req.user.id });
  const { favoriteDoctors } = patient;
  const favorites = favoriteDoctors.map((el) => el.toString());
  favorites.includes(doctor.id.toString())
    ? (favorite = true)
    : (favorite = false);

  res.status(200).json({
    status: 'success',
    data: {
      doctor,
      ratings,
      favorite,
    },
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
  const { doctorID, date, time, paymentMethod } = req.body;
  if (!doctorID || !date || !time || !paymentMethod)
    return next(
      new AppError('Please provide DoctorID, Date, Time and Payment Method!')
    );
  if (
    !validator.isISO8601(date) ||
    !validator.isAfter(date, new Date().toISOString())
  )
    return next(new AppError('Please provide a valid date!', 400));
  const dateTimeString = `${date} ${time}`;
  const dateTime = new Date(dateTimeString);
  const todayTime = new Date();
  const timeDifference = dateTime.getTime() - todayTime.getTime();
  if (timeDifference < 3 * 60 * 60 * 1000)
    return next(new AppError('You should book at least 3 hours in advance!'));
  const doctor = await Doctor.findById(doctorID).select('+availableTimes');
  if (!doctor) {
    return next(new AppError('No doctor found with that ID', 404));
  }
  const patient = await Patient.findOne({ user_id: user.id }).populate(
    'appointments'
  );
  const patientCheck = patient.checkAvailability(date, time, next);
  if (!patientCheck) return next();

  const doctorCheck = doctor.checkAvailability(date, time, next);
  if (!doctorCheck) return next();

  if (paymentMethod === 'card') {
    const session = await getCheckoutSession(req, doctor, date, time);
    if (!session)
      return next(
        new AppError('Something went wrong, please try again later ', 500)
      );
    const booking = await createBookingCheckout(session, date, time);
    if (!booking)
      return next(
        new AppError('Something went wrong, please try again later ', 500)
      );
    res.status(200).json({
      status: 'success',
      data: {
        session: session.url,
        booking: booking,
      },
    });
  } else if (paymentMethod === 'cash') {
    const appointment = await Appointment.create({
      patient_id: user.id,
      doctor_id: doctor.user_id,
      date,
      time,
      paymentMethod,
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

    await doctor.save();

    await Booking.create({
      user: user.id,
      doctor: doctor.id,
      appointment: appointment.id,
      date,
      time,
      status: 'confirmed',
      price: 200,
    });

    res.status(200).json({
      status: 'success',
      data: appointment,
    });
  } else {
    return next(new AppError('Please provide a valid payment method!', 400));
  }
});

exports.viewMyAppointments = catchAsync(async (req, res, next) => {
  const { user } = req;
  const appointments = await Appointment.find({ patient_id: user.id }).populate(
    {
      path: 'doctor_id',
      select: 'name photo',
    }
  );

  if (appointments.length === 0)
    return next(new AppError('No upcoming appointments yet!'), 404);
  const todayAppointments = appointments.filter(
    (appointment) => appointment.date.getDate() === new Date().getDate()
  );
  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.date.getDate() > new Date().getDate()
  );
  const pastAppointments = appointments.filter(
    (appointment) => appointment.date.getDate() < new Date().getDate()
  );
  res.status(200).json({
    status: 'success',
    data: {
      todayAppointments,
      upcomingAppointments,
      pastAppointments,
    },
  });
});

exports.viewAppointmentEMR = catchAsync(async (req, res, next) => {
  const appointmentID = req.params.id;
  if (!validator.isMongoId(appointmentID))
    return next(new AppError('Please provide a valid appointment ID!', 400));
  const emr = await EMR.findOne({ appointment: appointmentID }).populate({
    path: 'doctor',
    select: 'name',
  });
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
  if (!validator.isMongoId(req.body.reminderID))
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
  if (!validator.isMongoId(req.body.reminderID))
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
  if (!validator.isMongoId(req.params.reminderID))
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

exports.rateDoctor = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { doctorID, rating } = req.body;
  let data;
  if (!doctorID || !rating)
    return next(new AppError('Please provide doctorID and rating!', 400));
  if (!validator.isMongoId(doctorID))
    return next(new AppError('Please provide a valid doctor ID!', 400));
  const patient = await Patient.findOne({ user_id: user.id }).populate(
    'appointments'
  );
  const existingAppointmentIndex = patient.appointments.findIndex(
    (o) => o.doctor_id == doctorID && o.status === 'completed'
  );
  if (existingAppointmentIndex === -1)
    return next(new AppError(`You can't rate this doctor!`, 401));
  try {
    const newRating = await Rating.create({
      user: user.id,
      doctor: doctorID,
      rating,
    });
    data = newRating;
  } catch (err) {
    if (err.code === 11000)
      return next(new AppError('You have already rated this doctor!', 400));
  }
  res.status(200).json({
    status: 'success',
    data,
  });
});

exports.reviewDoctor = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { doctorID, review } = req.body;
  if (!doctorID || !review)
    return next(new AppError('Please provide doctorID and review!', 400));
  if (!validator.isMongoId(doctorID))
    return next(new AppError('Please provide a valid doctor ID!', 400));
  let existingRating = await Rating.findOne({
    user: user.id,
    doctor: doctorID,
  });
  if (!existingRating)
    return next(
      new AppError(
        `You can't review this doctor, please rate the doctor first!`,
        401
      )
    );
  if (existingRating.review)
    return next(new AppError(`You've already reviewed this doctor!`, 401));
  existingRating.review = review;
  await existingRating.save();
  res.status(200).json({
    status: 'success',
    data: existingRating,
  });
});

exports.editReview = catchAsync(async (req, res, next) => {
  const { reviewID } = req.params;
  const { doctorID, review } = req.body;
  if (!doctorID || !reviewID)
    return next(new AppError('Please provide doctorID and reviewID!', 400));
  if (!validator.isMongoId(doctorID))
    return next(new AppError('Please provide a valid doctor ID!', 400));
  if (!validator.isMongoId(reviewID))
    return next(new AppError('Please provide a valid review ID!', 400));
  const existingRating = await Rating.findByIdAndUpdate(
    reviewID,
    {
      review,
    },
    { new: true }
  );
  if (!existingRating)
    return next(new AppError('No review with that ID!', 400));
  res.status(200).json({
    status: 'success',
    data: existingRating,
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const { reviewID } = req.params;
  if (!reviewID) return next(new AppError('Please provide a review ID!', 400));
  if (!validator.isMongoId(reviewID))
    return next(new AppError('Please provide a valid review ID!', 400));
  const existingRating = await Rating.findByIdAndUpdate(
    reviewID,
    {
      review: '',
    },
    { new: true }
  );
  if (!existingRating)
    return next(new AppError('No review with that ID!', 400));
  if (existingRating.user.toString() !== req.user.id)
    return next(new AppError('You can only delete your own reviews!', 401));
  res.status(200).json({
    status: 'success',
    data: existingRating,
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

exports.addFavoriteDoctor = catchAsync(async (req, res, next) => {
  const { doctorID } = req.body;
  if (!doctorID) return next(new AppError('Please provide a doctor ID!', 400));
  if (!validator.isMongoId(doctorID))
    return next(new AppError('Please provide a valid doctor ID!', 400));
  const doctor = await Doctor.findById(doctorID);
  if (!doctor) return next(new AppError('No doctor with that ID!', 400));
  const patient = await Patient.findOne({ user_id: req.user.id });
  if (patient.favoriteDoctors.includes(doctorID))
    return next(new AppError('This doctor is already in your favorites!', 400));
  patient.favoriteDoctors.push(doctorID);
  await patient.save();
  res.status(200).json({
    status: 'success',
    data: patient,
  });
});

exports.removeFavoriteDoctor = catchAsync(async (req, res, next) => {
  const { doctorID } = req.body;
  if (!doctorID) return next(new AppError('Please provide a doctor ID!', 400));
  if (!validator.isMongoId(doctorID))
    return next(new AppError('Please provide a valid doctor ID!', 400));
  const patient = await Patient.findOne({ user_id: req.user.id });
  const existingDoctorIndex = patient.favoriteDoctors.findIndex(
    (o) => o.toString() === doctorID
  );
  if (existingDoctorIndex === -1)
    return next(new AppError('This doctor is not in your favorites!', 400));
  patient.favoriteDoctors.splice(existingDoctorIndex, 1);
  await patient.save();
  res.status(200).json({
    status: 'success',
    data: patient,
  });
});

exports.getFavoriteDoctors = catchAsync(async (req, res, next) => {
  const { user } = req;
  const patient = await Patient.findOne({ user_id: user.id }).populate({
    path: 'favoriteDoctors',
    select: 'name speciality ratingNum rate photo location',
  });
  res.status(200).json({
    status: 'success',
    data: patient.favoriteDoctors,
  });
});
