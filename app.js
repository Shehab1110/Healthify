const express = require('express');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const globalErrorController = require('./controllers/errorController');

const app = express();
const userRouter = require('./routes/userRoutes');

console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  next();
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Hello from server side!' });
});

app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorController);

module.exports = app;
