class AppError extends Error {
  constructor(message, statusCode) {
    super();
    this.message = message || 'Something went wrong, please try again later!';
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
