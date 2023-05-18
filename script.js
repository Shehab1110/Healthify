const cron = require('node-cron');
const chalk = require('chalk');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const catchAsync = require('./utils/catchAsync');

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
  console.log(chalk.green('Past days deleted!'));
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

const Doctor = require('./models/doctorModel');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.set('strictQuery', false);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(chalk.green('DB connection successful!'));
  });

deletePastDays(Doctor);
