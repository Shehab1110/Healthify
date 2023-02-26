const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const doctorController = require('../controllers/doctorController');

const router = express.Router();

router.get(
  '/viewMyAppointments',
  authController.protect,
  authController.permitOnly('doctor'),
  doctorController.viewMyAppointments
);

router.get(
  '/viewPatientEMR/:id',
  authController.protect,
  authController.permitOnly('doctor'),
  doctorController.viewPatientEMR
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

router.patch(
  '/markAppointmentAsCompletedByID',
  authController.protect,
  authController.permitOnly('doctor'),
  doctorController.markAppointmentAsCompletedByID
);

router.patch(
  '/createPatientEMR',
  authController.protect,
  authController.permitOnly('doctor'),
  doctorController.createPatientEMR
);

router.patch(
  '/updatePatientEMR',
  authController.protect,
  authController.permitOnly('doctor'),
  doctorController.updatePatientEMR
);

module.exports = router;
