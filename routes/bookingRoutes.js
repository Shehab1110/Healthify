const express = require('express');

const router = express.Router();

const bookingController = require('../controllers/bookingController');

router.get('/success', bookingController.confirmBooking);

module.exports = router;
