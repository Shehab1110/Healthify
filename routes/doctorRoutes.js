const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const doctorController = require('../controllers/doctorController');

const router = express.Router();

router.get(
  '/viewMyAppointments',
  authController.protect,
  doctorController.viewMyAppointments
);

router.patch(
  '/setAvailableTimes',
  authController.protect,
  authController.permitOnly('doctor'),
  doctorController.setAvailableTimes
);

router.patch(
  '/cancelAppointmentByID',
  authController.protect,
  userController.cancelAppointmentByID
);

module.exports = router;
