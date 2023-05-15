const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');

exports.getCheckoutSession = async (req, doctor, date, time) => {
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get(
      'host'
    )}/api/v1/bookings/success/?doctor=${doctor.id}&user=${
      req.user.id
    }&date=${date}&time=${time}`,
    cancel_url: `${req.protocol}://${req.get('host')}/doctor/${doctor.slug}`,
    customer_email: req.user.email,
    client_reference_id: doctor.id,
    line_items: [
      {
        price_data: {
          currency: 'egp',
          unit_amount: 200 * 100,
          product_data: {
            name: `${doctor.name} Appointment`,
          },
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
  });
  return session;
};

exports.createBookingCheckout = async (session, date, time) => {
  const doctor = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.amount_total / 100;
  const booking = await Booking.create({ doctor, user, price, date, time });
  return booking;
};

exports.confirmBooking = catchAsync(async (req, res, next) => {
  const { user, date, time } = req.query;
  const doctorId = req.query.doctor;
  if (!doctorId && !user && !date && !time)
    return next(
      new AppError('Please provide the doctor id, user id, date and time!')
    );
  let doctor = await Doctor.findById(doctorId).select('+availableTimes');
  if (!doctor) return next(new AppError('No doctor found!', 404));

  const check = await doctor.checkAvailability(date, time, next);
  // To prevent sending the response twice
  if (!check) return next();

  await doctor.save();

  let booking = await Booking.findOne({ doctor, user, date, time });
  if (!booking) return next(new AppError('No booking found!', 404));

  booking.status = 'confirmed';

  const appointment = await Appointment.create({
    patient_id: user,
    doctor_id: doctor.user_id,
    date,
    time,
    paymentMethod: 'card',
    booking: booking.id,
  });
  booking.appointment = appointment.id;
  await booking.save();
  res.status(200).json({
    status: 'success',
    message: 'Booking confirmed successfully!',
  });
});
