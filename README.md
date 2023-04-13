# Healthify 💊

Healthify is a back-end server designed to help medical professionals and patients' medical life, including appointments, EMRs, and medicine reminders, symptoms diagnosis. It provides a secure, centralized platform for patients and healthcare providers to collaborate and share information, improving the quality of care provided.

## Features 🚀

### Patient features:

- Search for doctors by speciality or name and getting the nearest doctors
- Schedule appointments with doctors
- Cancel appointments
- Reschedule appointments
- View electronic medical records (EMRs) associated with their appointments
- Calculate BMI
- Create, update, and manage medicine reminders
- Rate and review doctors
- Diagnose symptoms and get a feedback
- Access Health Resources
- Communicate with doctor

### Doctor features:

- View their appointments
- View patient EMRs
- Set their available times
- Mark appointments as completed
- Cancel appointment
- Create and update patient EMRs
- Communicate with patient

### User management features:

- User authentication and authorization
- User sign-up and login
- Update user profile
- Reset forgotten password
- Admin can create doctor accounts

## Technologies Used 💻

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT) for authentication
- bcrypt for password hashing
- Nodemailer for sending email
- Render for deployment

## Installation and Usage 🛠️

1. Clone this repository to your local machine.
2. Install dependencies using `npm install`.
3. Create a `config.env` file and add the needed environment variables.
4. Start the server using `npm start`.
5. Use `http://localhost:3000` in your postman and add the route of any API and start testing and using!# ***Features***
### *Patient features*:
Search for doctors by speciality or name and getting the nearest doctors, 
Schedule appointments with doctors,
Cancel appointments, 
Reschedule appointments, 
View electronic medical records (EMRs) associated with their appointments, 
Calculate BMI, 
Create, update, and manage medicine reminders, 
Rate and review doctors, 
Diagnose symptoms and get a feedback, 
Access Health Resources,
Communicate with doctor
### *Doctor features*:
View their appointments, 
View patient EMRs, 
Set their available times, 
Mark appointments as completed,
Cancel appointment, 
Create and update patient EMRs,
Communicate with patient, 
### *User management features*:
User authentication and authorization, 
User sign-up and login, 
Update user profile, 
Reset forgotten password, 
Admin can create doctor accounts, 
# ***Technologies Used***
Node.js, 
Express.js, 
MongoDB, 
Mongoose, 
JSON Web Token (JWT) for authentication, 
bcrypt for password hashing, 
Nodemailer for sending email, 
Render for deployment, 
# ***Installation and Usage***
Clone this repository to your local machine.
Install dependencies using `npm install`.
Create a `config.env` file and add the needed environment variables.
Start the server using `npm start`.
Use `http://localhost:3000` in your postman and add the route of any API and start testing and using!
# ***API Documentation***
## *Patient routes*
##### `GET /searchDoctorsBySpeciality/:speciality:` Search for doctors by speciality
##### `GET /searchDoctors/:name/:speciality:` Search for doctors by name and speciality
##### `GET /viewDoctorByID/:id:` View a doctor's profile by ID
##### `GET /viewDoctorByUserID/:id:` View a doctor's profile by user ID
##### `GET /viewMyAppointments:` View a patient's appointments
##### `GET /viewMyEMRs:` View a patient's electronic medical records
##### `GET /viewAppointmentEMR/:id:` View an appointment's electronic medical record
##### `GET /viewMedicineReminders:` View a patient's medicine reminders
##### `POST /scheduleAppointment:` Schedule an appointment with a doctor
##### `POST /calculateMyBMI:` Calculate a patient's BMI
##### `POST /createMedicineReminder:` Create a medicine reminder
##### `POST /rateAndReview:` Rate and review a doctor
##### `POST /diagnoseSymptoms:` Diagnose symptoms
##### `PATCH /cancelAppointmentByID/:id:` Cancel an appointment by ID
##### `PATCH /updateMedicineReminder/:reminderID:` Update a medicine reminder by ID
##### `PATCH /deactivateMedicineReminder:` Deactivate a medicine reminder
##### `PATCH /activateMedicineReminder:` Activate a medicine reminder
##### `DELETE /deleteMedicineReminder/:reminderID:` Delete a medicine reminder by ID
## *Doctor routes*
##### `GET /viewMyAppointments:` View a doctor's appointments
##### `GET /viewPatientEMR/:id:` View a patient's electronic medical record
##### `PATCH /setAvailableTimes:` Set a doctor's available times
##### `PATCH /cancelAppointmentByID:` Cancel an appointment by ID
##### `PATCH /markAppointmentAsCompletedByID:` Mark an appointment as completed by ID
##### `PATCH /createPatientEMR:` Create a patient's electronic medical record
##### `PATCH /updatePatientEMR:` Update a patient's electronic medical record
# ***Project Status***
This project is actively being developed and maintained, continuously adding new features and improving existing functionality. As such, there is always work to be done.

# ***API Documentation***
## *Patient routes*
##### `GET /searchDoctorsBySpeciality/:speciality:` Search for doctors by speciality
##### `GET /searchDoctors/:name/:speciality:` Search for doctors by name and speciality
##### `GET /viewDoctorByID/:id:` View a doctor's profile by ID
##### `GET /viewDoctorByUserID/:id:` View a doctor's profile by user ID
##### `GET /viewMyAppointments:` View a patient's appointments
##### `GET /viewMyEMRs:` View a patient's electronic medical records
##### `GET /viewAppointmentEMR/:id:` View an appointment's electronic medical record
##### `GET /viewMedicineReminders:` View a patient's medicine reminders
##### `POST /scheduleAppointment:` Schedule an appointment with a doctor
##### `POST /calculateMyBMI:` Calculate a patient's BMI
##### `POST /createMedicineReminder:` Create a medicine reminder
##### `POST /rateAndReview:` Rate and review a doctor
##### `POST /diagnoseSymptoms:` Diagnose symptoms
##### `PATCH /cancelAppointmentByID/:id:` Cancel an appointment by ID
##### `PATCH /updateMedicineReminder/:reminderID:` Update a medicine reminder by ID
##### `PATCH /deactivateMedicineReminder:` Deactivate a medicine reminder
##### `PATCH /activateMedicineReminder:` Activate a medicine reminder
##### `DELETE /deleteMedicineReminder/:reminderID:` Delete a medicine reminder by ID
## *Doctor routes*
##### `GET /viewMyAppointments:` View a doctor's appointments
##### `GET /viewPatientEMR/:id:` View a patient's electronic medical record
##### `PATCH /setAvailableTimes:` Set a doctor's available times
##### `PATCH /cancelAppointmentByID:` Cancel an appointment by ID
##### `PATCH /markAppointmentAsCompletedByID:` Mark an appointment as completed by ID
##### `PATCH /createPatientEMR:` Create a patient's electronic medical record
##### `PATCH /updatePatientEMR:` Update a patient's electronic medical record
# ***Project Status***
This project is actively being developed and maintained, continuously adding new features and improving existing functionality. As such, there is always work to be done.
