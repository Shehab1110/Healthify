const express = require('express');
const patientController = require('../controllers/patientController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get(
  '/searchDoctorsBySpeciality/:speciality/:coordinates',
  authController.protect,
  patientController.searchDoctorsBySpeciality
);

router.get(
  '/searchDoctors/:name/:speciality?',
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

router.get(
  '/viewMyEMRs',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.viewMyEMRs
);

router.get(
  '/viewAppointmentEMR/:id',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.viewAppointmentEMR
);

router.get(
  '/viewMedicineReminders',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.viewMyMedicineReminders
);

router.post(
  '/scheduleAppointment',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.scheduleAppointment
);

router.post(
  '/calculateMyBMI',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.calculateBMI
);

router.post(
  '/createMedicineReminder',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.createMedicineReminder
);

router.post(
  '/rateAndReview',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.rateAndReview
);

router.post('/diagnoseSymptoms', patientController.diagnoseSymptoms);

router.patch(
  '/cancelAppointmentByID/:id',
  authController.protect,
  userController.cancelAppointmentByID
);

router.patch(
  '/updateMedicineReminder/:reminderID',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.updateMedicineReminder
);

router.patch(
  '/deactivateMedicineReminder',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.deactivateMedicineReminder
);

router.patch(
  '/activateMedicineReminder',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.activateMedicineReminder
);

router.delete(
  '/deleteMedicineReminder/:reminderID',
  authController.protect,
  authController.permitOnly('patient'),
  patientController.deleteMedicineReminder
);

module.exports = router;
