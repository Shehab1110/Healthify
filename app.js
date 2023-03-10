const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/errorController');

const app = express();
const userRouter = require('./routes/userRoutes');
const patientRouter = require('./routes/patientRoutes');
const doctorRouter = require('./routes/doctorRoutes');

app.use(helmet());

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Setting a rate-limit for requests from the same IP
const limiter = rateLimit({
  max: 250,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

app.use(express.json());

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello from server side!' });
});

app.use('/api/v1/users', userRouter);
app.use('/api/v1/patients', patientRouter);
app.use('/api/v1/doctors', doctorRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Middleware
app.use(globalErrorController);

module.exports = app;
