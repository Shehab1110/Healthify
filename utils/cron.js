const cron = require('node-cron');
const chalk = require('chalk');
const catchAsync = require('./catchAsync');

const deletePastDays = catchAsync(async (Doctor) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const doctors = await Doctor.find({}).select('+availableTimes');
  doctors.forEach(async (doctor) => {
    if (doctor.availableTimes.length === 0) return;
    const updatedAvailableTimes = doctor.availableTimes.filter(
      (el) => new Date(el.day) > currentDate
    );
    doctor.availableTimes = updatedAvailableTimes;
    await doctor.save();
  });
});

const scheduleCronJob = (Doctor) => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log(chalk.green('Running a job every day at 00:00'));
      await deletePastDays(Doctor);
      console.log(chalk.green('Job done!'));
    } catch (err) {
      console.log(chalk.red(err));
      console.log(chalk.red('Job failed!'));
    }
  });
};

module.exports = scheduleCronJob;
