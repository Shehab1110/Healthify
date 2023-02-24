const Doctor = require('../models/doctorModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setAvailableTimes = catchAsync(async (req, res, next) => {
  const { availableTimes } = req.body;
  const doctorId = req.user.id;
  const doctor = await Doctor.findOne({ user_id: doctorId }).select(
    '+availableTimes'
  );
  availableTimes.hourRange = doctor.getHourRange(
    availableTimes.startTime,
    availableTimes.endTime
  );
  console.log(availableTimes);

  if (doctor) {
    // check if an object with the same day already exists in the array
    const existingObjIndex = doctor.availableTimes.findIndex(
      (o) => o.day.getTime() === new Date(availableTimes.day).getTime()
    );

    if (existingObjIndex >= 0) {
      // if object with the same day exists, update it
      doctor.availableTimes[existingObjIndex].startTime =
        availableTimes.startTime;
      doctor.availableTimes[existingObjIndex].endTime = availableTimes.endTime;
      doctor.availableTimes[existingObjIndex].hourRange =
        availableTimes.hourRange;
    } else {
      // if object with the same day does not exist, add the new object to the array
      doctor.availableTimes.push(availableTimes);
    }
    await doctor.save();
  } else {
    // handle error if doctor does not exist
    return new AppError(`Doctor with id ${doctorId} not found`, 400);
  }
  res.status(200).json({
    status: 'success',
    data: doctor,
  });
});
