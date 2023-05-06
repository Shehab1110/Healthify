const sgMail = require('@sendgrid/mail');

module.exports = function (user, subject, text, html) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: `${user.email}`, // Change to your recipient
    from: 'sfe.healthify@gmail.com', // Change to your verified sender
    subject,
    text,
    html,
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log('Email sent');
    })
    .catch((error) => {
      console.error(error);
    });
};
