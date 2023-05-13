const mongoose = require('mongoose');

const dotenv = require('dotenv');

const chalk = require('chalk');

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(chalk.red('Uncaught Exception!'));
  console.log(chalk.red(err.name, err.message));
  process.exit(1);
});

const app = require('./app');

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

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(chalk.green(`App running on port ${port}...`));
});

process.on('unhandledRejection', (err) => {
  console.log(chalk.red('Unhandled Rejection!'));
  console.log(chalk.red(err.name, err.message));
  server.close(() => {
    process.exit(1);
  });
});
