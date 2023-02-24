const express = require('express');
const patientController = require('../controllers/patientController');
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

router.post(
  '/scheduleAppointment',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.scheduleAppointment
);

module.exports = router;
