const express = require('express');

const router = express.Router();

const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

router.get('/success', bookingController.confirmBooking);

module.exports = router;
