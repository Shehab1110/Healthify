<h1 align="center">Healthify</h1>
<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js badge">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express badge">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB badge">
</p>
Healthify is a Back-end server designed to help medical professionals and patients' medical life, including appointments, EMRs, and medicine reminders, symptoms diagnosis. It provides a secure, centralized platform for patients and healthcare providers to collaborate and share information, improving the quality of care provided.

## :rocket: Getting Started

To run this project locally, you need to have Node.js and MongoDB installed on your machine.

### Prerequisites

- Node.js
- MongoDB
- NPM or Yarn

### Installation

1. Clone this repo to your local machine using `git clone https://github.com/<your-username>/healthify.git`.
2. Go to the project directory using `cd Healthify`.
3. Install the dependencies using `npm install` or `yarn install`.
4. Create a `.env` file in the root folder and add the following environment variables:

`
NODE_ENV=development
PORT=3000
DATABASE=<your-mongodb-connection-string>
DATABASE_PASSWORD=<your-mongodb-password>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES_IN=90
EMAIL_USERNAME=<your-email-username>
EMAIL_PASSWORD=<your-email-password>
EMAIL_HOST=<your-email-host>
EMAIL_PORT=<your-email-port>
EMAIL_FROM=<your-email-address>
STRIPE_SECRET_KEY=<your-stripe-secret-key>`

Run the app using npm start or yarn start.<br> Open your browser and go to http://localhost:3000.<br> 

## :sparkles: Features
User registration and login with JWT authentication<br> Password reset with email verification<br> User profile update and deletion<br> User roles and permissions<br> Searching for nearest doctors by specialty and/or name<br> Scheduling appointments and cancelling appointments<br> Online payment using stripe<br> Accessing patient EMR<br> Create, Read, Update operations on patient's EMR by doctor with right permissions<br> Ratings and reviews of a doctor with validations in place<br> Calculating BMI<br> CRUD operations on Medicine Reminders for patient<br> Communication between patient and doctor<br> Error handling and logging<br>
## :hammer_and_wrench: Technologies
Node.js<br> Express<br> MongoDB<br> Mongoose<br> Stripe<br> Sendgrid<br> Helmet<br> Morgan<br> Bcrypt<br> Validator<br> JWT<br> Multer<br> express-rate-limit<br> express-mongo-sanitize<br> xss-clean<br> 
## :construction: Project Status
This project is actively being developed and maintained, continuously adding new features and improving existing functionality. As such, there is always work to be done.
