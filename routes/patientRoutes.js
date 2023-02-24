const express = require('express');
const patientController = require('../controllers/patientController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/searchDoctorsBySpeciality/:speciality',
  authController.protect,
  patientController.searchDoctorsBySpeciality
);

router.get(
  '/searchDoctors/:name/:speciality',
  authController.protect,
  patientController.searchDoctors
);

router.get(
  '/viewDoctorByID/:id',
  authController.protect,
  patientController.viewDoctorByID
);

router.get(
  '/viewDoctorByUserID/:id',
  authController.protect,
  patientController.viewDoctorByUserID
);

router.get(
  '/viewMyAppointments',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.viewMyAppointments
);

router.post(
  '/scheduleAppointment',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.scheduleAppointment
);

router.patch(
  '/cancelAppointmentByID/:id',
  authController.protect,
  userController.cancelAppointmentByID
);

module.exports = router;
