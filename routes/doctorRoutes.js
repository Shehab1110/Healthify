const express = require('express');
const authController = require('../controllers/authController');
const doctorController = require('../controllers/doctorController');

const router = express.Router();

router.patch(
  '/setAvailableTimes',
  authController.protect,
  authController.permitOnly('doctor'),
  doctorController.setAvailableTimes
);

module.exports = router;
